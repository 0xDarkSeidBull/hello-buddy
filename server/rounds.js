/**
 * rounds.js — the rolling 2-slot round engine for BetsOnBlock.
 *
 * Model (matches the agreed timing):
 *   - Two rounds are always live, staggered by 5 minutes.
 *   - A round opens, accepts bets, then betting LOCKS 30s before settle.
 *   - At settle time the engine reads the chain's CURRENT block as the
 *     round's target block and resolves every bet from its public data.
 *   - When a round settles it is removed; the later round becomes the
 *     "closing" slot and a brand-new round is appended 5 min further out.
 *
 * Time, not block height, drives the schedule (0.2s blocks make height
 * impractical to predict exactly). The target block is whatever block is
 * live at settle time — unknown and unmanipulable at bet time, so it stays
 * provably fair.
 */
import { JsonRpcProvider } from "ethers";
import { settleBet, settleClosest, MODES } from "../shared/blockgame.js";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
const provider = new JsonRpcProvider(RPC, 4441, { staticNetwork: true });

const ROUND_MS = 5 * 60 * 1000;   // 5 min lifetime per round
const LOCK_MS = 30 * 1000;        // betting closes 30s before settle
const RAKE = 0.02;

let _idSeq = 1;
const rounds = new Map();          // id -> round
const history = [];                // settled rounds (most recent first)

function nowAligned() {
  // align round boundaries to clean 5-min marks from process start
  return Date.now();
}

function makeRound(settleAt) {
  const id = _idSeq++;
  const r = {
    id,
    openAt: Date.now(),
    lockAt: settleAt - LOCK_MS,
    settleAt,
    status: "open",            // open -> locked -> settling -> settled
    targetBlock: null,         // filled at settle
    bets: [],                  // { wallet, mode, pick, stake }
    result: null,              // settlement summary
  };
  rounds.set(id, r);
  return r;
}

/** Public view of a round for the API/UI. */
export function roundView(r) {
  // aggregate bets into per-(mode,pick) pools so the UI can show real
  // "bank" splits and voting % like a prediction market.
  const poolMap = {};
  for (const b of r.bets) {
    const key = b.mode + ":" + b.pick;
    if (!poolMap[key]) poolMap[key] = { mode: b.mode, pick: b.pick, stake: 0, players: new Set() };
    poolMap[key].stake += b.stake;
    poolMap[key].players.add(b.wallet);
  }
  const pools = Object.values(poolMap).map((p) => ({
    mode: p.mode, pick: p.pick, stake: +p.stake.toFixed(6), players: p.players.size,
  }));
  return {
    id: r.id,
    status: r.status,
    openAt: r.openAt,
    lockAt: r.lockAt,
    settleAt: r.settleAt,
    msToLock: Math.max(0, r.lockAt - Date.now()),
    msToSettle: Math.max(0, r.settleAt - Date.now()),
    targetBlock: r.targetBlock,
    result: r.result,
    totalBets: r.bets.length,
    totalStaked: +r.bets.reduce((s, b) => s + b.stake, 0).toFixed(6),
    players: new Set(r.bets.map((b) => b.wallet)).size,
    pools,
  };
}

export function liveRounds() {
  return [...rounds.values()]
    .filter((r) => r.status !== "settled")
    .sort((a, b) => a.settleAt - b.settleAt)
    .map(roundView);
}

export function recentHistory(n = 20) {
  return history.slice(0, n);
}

export function placeBet({ wallet, roundId, mode, pick, stake }) {
  const r = rounds.get(Number(roundId));
  if (!r) return { ok: false, error: "round_not_found" };
  if (r.status !== "open") return { ok: false, error: "betting_closed" };
  if (!MODES[mode]) return { ok: false, error: "bad_mode" };
  const amt = Number(stake);
  if (!Number.isFinite(amt) || amt <= 0) return { ok: false, error: "bad_stake" };
  r.bets.push({ wallet: String(wallet).toLowerCase(), mode, pick: String(pick), stake: amt });
  return { ok: true, round: roundView(r) };
}

async function fetchTargetBlock() {
  const bn = await provider.getBlockNumber();
  const b = await provider.getBlock(bn);
  return {
    number: b.number,
    hash: b.hash,
    txCount: b.transactions.length,
    gasUsed: b.gasUsed.toString(),
  };
}

async function settleRound(r) {
  r.status = "settling";
  const block = await fetchTargetBlock();
  r.targetBlock = block;

  // settle standard bets
  let totalWon = 0, totalLost = 0, winners = 0, losers = 0;
  const perBet = [];
  for (const b of r.bets) {
    if (b.mode === "closest") continue;
    const s = settleBet(block, b.mode, b.pick, b.stake);
    perBet.push({ ...b, ...s });
    if (s.win) { winners++; totalWon += s.payout; } else { losers++; totalLost += b.stake; }
  }
  // settle PvP closest pool
  const closestBets = r.bets.filter((b) => b.mode === "closest");
  const closest = settleClosest(block, closestBets, RAKE);

  r.result = {
    block,
    perBet,
    closest,
    stats: {
      players: new Set(r.bets.map((b) => b.wallet)).size,
      totalBets: r.bets.length,
      winners,
      losers,
      totalStaked: +r.bets.reduce((s, b) => s + b.stake, 0).toFixed(6),
      totalPaidOut: +totalWon.toFixed(6),
    },
  };
  r.status = "settled";
  history.unshift({ ...roundView(r), result: r.result });
  if (history.length > 100) history.pop();
  rounds.delete(r.id);
}

/** The engine tick: lock rounds at lockAt, settle at settleAt, keep two live. */
async function tick() {
  const now = Date.now();
  for (const r of [...rounds.values()]) {
    if (r.status === "open" && now >= r.lockAt) r.status = "locked";
    if (r.status === "locked" && now >= r.settleAt) {
      try { await settleRound(r); } catch (e) { console.error("[settle]", e.message); r.status = "locked"; }
    }
  }
  // ensure exactly two future rounds exist
  const live = [...rounds.values()].filter((r) => r.status !== "settled");
  if (live.length < 2) {
    const lastSettle = live.length
      ? Math.max(...live.map((r) => r.settleAt))
      : now;
    const base = Math.max(lastSettle, now);
    makeRound(base + ROUND_MS);
  }
}

export function startEngine() {
  // seed the two initial rounds: one closing in 5 min, one in 10 min
  const now = nowAligned();
  makeRound(now + ROUND_MS);
  makeRound(now + 2 * ROUND_MS);
  setInterval(() => { tick().catch((e) => console.error(e)); }, 1000);
  console.log("[BetsOnBlock] round engine started");
}
