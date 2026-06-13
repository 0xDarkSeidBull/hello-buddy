<div align="center">

<img src="https://raw.githubusercontent.com/dopedopex/your-friendly-helper/main/logo.png" alt="BetsOnBlock" width="120" />

# BetsOnBlock

**Provably-fair on-chain prediction games built on LiteForge (zkLTC).**

Every outcome is decided by a future LiteForge block. Nobody can predict it. Nobody can fake it. Every result is verifiable on-chain.

[![Live App](https://img.shields.io/badge/App-betsonblock.test--hub.xyz-000000?style=for-the-badge&logoColor=white)](https://betsonblock.test-hub.xyz/)
[![API](https://img.shields.io/badge/API-betsonblock--api.test--hub.xyz-orange?style=for-the-badge)](https://betsonblock-api.test-hub.xyz/api/rounds)
[![X](https://img.shields.io/badge/Twitter-@BetsOnBlock-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/betsonblock)

</div>

---

## 🏆 LiteForge Hackathon Submission

| Field | Value |
|---|---|
| **App Name** | BetsOnBlock |
| **Description** | Provably-fair on-chain prediction games on LiteForge  8 game modes, 5 live rounds, real zkLTC payouts, Mystery Box rewards, every result verifiable on-chain. |
| **Live App** | https://betsonblock.test-hub.xyz |
| **API** | https://betsonblock-api.test-hub.xyz/api/rounds |
| **Demo Video  Betting Zone** | https://x.com/betsonblock/status/2063312150144364732?s=20 |
| **Demo Video  PVP Tiles** | https://x.com/betsonblock/status/2064674394212045009?s=20 |
| **Chain** | LiteForge Testnet  Chain ID `4441` |
| **RPC** | `https://liteforge.rpc.caldera.xyz/http` |

---

## ✨ What is BetsOnBlock?

BetsOnBlock is a provably-fair on-chain betting platform built exclusively on the LiteForge testnet. Players predict properties of a **future LiteForge block**  its hash, transaction count, and gas used  before it's mined. The moment the block lands, all bets settle automatically and winners receive **real zkLTC** sent directly to their wallets on-chain.

No RNG server. No randomness seed you have to trust. The block hash is the source of truth  publicly readable by anyone, impossible to manipulate after bets close.

- 🎲 **8 game modes**  from simple coin flips to a 50× perfect-block guess
- 🔄 **5 concurrent live rounds**  always something to bet on, settling every 3 minutes
- 💸 **Automatic on-chain payouts**  winners receive zkLTC directly in their wallet, no claim needed
- 🎁 **Mystery Box rewards**  earn boxes by playing competitive rounds, win LitDEX points on-chain
- 🔍 **100% verifiable**  click VERIFY on any ended round and check the result yourself on the LiteForge block explorer
- ⚡ **~0.2s LiteForge blocks**  rounds settle fast, outcomes are real

---

## 🎮 Game Modes (8 Total)

All outcomes are derived from a single pure function (`deriveSignals`) applied to the target block's public data. The same function runs on the server to settle bets and on the frontend to verify them  no server trust required.

| Mode | Mechanic | Payout |
|---|---|---|
| **Coin Flip** | Is the block hash even or odd? | 1.96× |
| **Hi-Lo** | Last hex digit Low (0-7) or High (8-f)? | 1.96× |
| **Lucky Digit** | Guess the exact last hex digit (0-f) | 15.5× |
| **Number 0-99** | Guess `hash mod 100` exactly (0-99) | 97× |
| **Txn Over/Under** | Will the block have > 5 transactions? | 1.96× |
| **Gas Over/Under** | Will gas used exceed 500,000? | 1.96× |
| **Closest (PvP)** | Guess `hash mod 1000`  nearest guess wins the whole pot | 98% of pot |
| **Perfect Block** | Guess the **exact** block number that will settle the round | 50× |

Every mode stacks  place bets on multiple modes in the same round for a flat 0.01 zkLTC each.

---

## 🎁 Mystery Box

Mystery Box is a daily reward system for active players. Play competitive rounds, earn boxes, and win LitDEX points awarded directly on-chain to your wallet.

### How to Earn
- Play in **competitive rounds** (2+ wallets in the pool)
- Every **10 qualifying bets** = 1 Mystery Box unlock
- Maximum **3 boxes per day**

### Rarity & Rewards

| Rarity | Chance | Points Reward |
|---|---|---|
| 🟢 **COMMON** | 59% | 100 – 500 pts |
| 🔵 **RARE** | 30% | 500 – 2,000 pts |
| 🟣 **EPIC** | 9% | 2,000 – 10,000 pts |
| 🟡 **LEGENDARY** | 1% | 50,000 pts |

Points are awarded directly to your **LitDEX wallet on-chain**  no manual claim, no delays.

Click the 🎁 **MYSTERY BOX** button in the header to track your progress and open earned boxes.

---

## ✅ Provably Fair Design

The entire outcome logic lives in a single shared file  [`shared/blockgame.js`](./shared/blockgame.js)  used by **both** the backend (to settle) and the frontend (to verify and render the Provably Fair panel):

```js
// shared/blockgame.js  pure, no side effects, no network calls
export function deriveSignals(block) {
  const n = BigInt(block.hash);
  return {
    even:       n % 2n === 0n,            // → Coin Flip
    lastNibble: lastNibble(block.hash),   // → Lucky Digit, Hi-Lo
    mod100:     Number(n % 100n),         // → Number 0-99
    mod1000:    Number(n % 1000n),        // → Closest PvP
    txCount:    block.txCount,            // → Txn Over/Under
    gasUsed:    block.gasUsed,            // → Gas Over/Under
  };
}
```

**Why this is provably fair:**

- **No RNG**  every outcome is deterministic and derived only from the block hash
- **No server secrets**  the target block doesn't exist yet when bets close (30s lockout before settle)
- **No manipulation**  a ~0.2s LiteForge block window is too short to game
- **Fully verifiable**  anyone can run `deriveSignals` against the on-chain block and reproduce every result independently
- **VERIFY button**  every ended round links directly to the LiteForge block explorer

---

## 🏗️ Architecture

```
betsonblock/
├── server/
│   ├── index.js     Express API (Node.js, port 3201), endpoints: rounds, bet, history, head, verify
│   └── rounds.js    Round engine: creates 5 live rounds, settles on LiteForge blocks, sends payouts
├── shared/
│   └── blockgame.js Pure derive/settle functions  shared between server + frontend (no trust needed)
└── src/
    ├── components/
    │   ├── Home.tsx              Landing page: how it works, live demo, derivation explainer
    │   ├── RoundCard.tsx         Per-round betting card: all 8 modes, live countdown, pot info
    │   ├── RoundsCarousel.tsx    2-card carousel with arrow navigation for 5 live rounds
    │   ├── YourBets.tsx          Live + Ended bets panel per wallet
    │   ├── YourBetsModal.tsx     Full bets modal with win/loss details
    │   ├── ModeHelpModal.tsx     Per-mode help popup with historical stats + AI suggestion
    │   ├── MysteryBox.tsx        Mystery Box progress tracker + box opening UI
    │   ├── ProvablyFair.tsx      On-chain verification panel
    │   ├── BetToast.tsx          Bet confirmed toast notification
    │   ├── DemoWidget.tsx        Interactive demo on the homepage
    │   └── WalletButton.tsx      Wallet connect + balance display
    └── App.tsx                   Routing (home ↔ /bettingzone), round polling, state management
```

**Stack:**

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS + RainbowKit + wagmi + viem
- **Backend:** Node.js + Express  stateless in-memory round engine, no database
- **Chain:** LiteForge Testnet (zkLTC)  Chain ID `4441`, ~0.2s block time
- **Deployment:** Vercel (frontend) + Contabo VPS + PM2 (backend) + Caddy (SSL/HTTPS)

---

## 🔌 API Reference

Base URL: `https://betsonblock-api.test-hub.xyz`

| Endpoint | Method | Description |
|---|---|---|
| `/api/rounds` | GET | All 5 live rounds  timing, pools, player counts, EST. target block |
| `/api/head` | GET | Current LiteForge block number (for live block ticker) |
| `/api/history` | GET | Last N settled rounds with full results  supports `?page=&limit=` |
| `/api/bets/:wallet` | GET | All bets for a wallet address (paginated) |
| `/api/bet` | POST | Place a bet `{ wallet, roundId, mode, pick, stake }` |
| `/api/verify/:blockNumber` | GET | Derive all signals from any past block (provably fair verification) |

---

## ⚙️ How Rounds Work

```
T+0:00  Round opens → accepts bets across all 8 modes
T+2:30  Betting LOCKS (30s before settle)  no new bets accepted
T+3:00  Backend reads current LiteForge block → derives signals → settles all bets
        Winners receive zkLTC on-chain automatically
        Round moves to Ended Rounds panel with VERIFY link
        A new round is created 3 minutes further out to maintain 5 live rounds
```

Five rounds run simultaneously, staggered 3 minutes apart  always a CLOSING round (≤3 min) and HOT rounds (3–15 min) visible side by side.

---

## 🔴 Live Round Logic

```
CLOSING  = round settling in < 3 min  → shown with red CLOSING badge
HOT      = round settling in 3-15 min → shown with orange HOT badge
LOCKED   = last 30s before settle     → betting disabled, waiting for block
```

The frontend polls `/api/rounds` every 3 seconds and `/api/head` every 3 seconds for a live block ticker. Countdown timers run client-side from the `settleAt` timestamp.

---

## 🚀 Run Locally

Prerequisites: Node 18+, a wallet with LiteForge testnet zkLTC.

```bash
# Clone
git clone https://github.com/0xDarkSeidBull/betsonblock.git
cd betsonblock

# Install
npm install

# Start the backend (set your payout wallet key)
PAYOUT_PRIVATE_KEY=0x... node server/index.js

# Start the frontend (new terminal)
npm run dev
```

- Frontend: `http://localhost:3200`
- Backend API: `http://localhost:3201`

---

## 🌐 LiteForge Integration

BetsOnBlock is built **exclusively for LiteForge testnet (zkLTC)**:

- All block reads: `https://liteforge.rpc.caldera.xyz/http` (Chain ID `4441`)
- Result verification: `https://liteforge.explorer.caldera.xyz/block/{number}`
- Native token: `zkLTC` | Block time: `~0.2s`
- **Real on-chain payouts**  winners receive zkLTC via signed transactions from the payout wallet  no wrapping, no bridges, no claims
- The ~0.2s block time means round settlement is near-instant once the target block arrives

---

## 📊 Stats

- ⚡ ~0.2s block time → fast, fair settlement
- 🎮 8 unique game modes  stackable, flat 0.01 zkLTC each
- 🔄 5 concurrent live rounds  3-minute intervals, 15-minute span
- 💸 Automatic on-chain zkLTC payouts per winning bet
- 🎁 Mystery Box daily rewards  earn LitDEX points on-chain
- 🔍 Every result independently verifiable on LiteForge block explorer
- 🏆 Winners marquee ticker  live feed of recent wins scrolling across the app

---

## 📁 Repo Structure

```
.
├── server/
│   ├── index.js          # Express API server
│   └── rounds.js         # Round engine + payout logic
├── shared/
│   └── blockgame.js      # Pure provably-fair core (shared frontend + backend)
├── src/
│   ├── App.tsx            # Root + routing
│   ├── components/        # All UI components
│   └── lib/
│       └── api.ts         # API client helpers
├── vercel.json            # API proxy + SPA fallback rewrites
├── vite.config.ts
└── package.json
```

---

## 🎯 PVP Tiles  Provably Fair Pool Betting

A separate on-chain PvP game built alongside BetsOnBlock, also on LiteForge (zkLTC).

30 tiles. Every 90 seconds. One winning tile. Winners split the entire pool.

**Live App:** https://[your-pvp-url]
**API:** https://lit-api.test-hub.xyz/bets/status
**Contract:** `0xfC4f072f48d0981BfdEED048356c0Bf80d7799Aa` (LiteForge Testnet)
**Demo Video:** https://x.com/betsonblock/status/2064674394212045009?s=20

---

### ✨ How PVP Tiles Works

Players bet zkLTC on any of 30 numbered tiles before a round locks. When the round ends, a winning tile is selected using **Drand**  a decentralised randomness beacon  and every player who bet on that tile shares the **entire pool** proportional to their stake.

No house picks the winner. No RNG server. The Drand beacon is run by independent organisations worldwide (Cloudflare, EPFL, University of Chile and others). Every result is independently verifiable.

---

### 💰 Payout Formula

```
fee        = totalPool × 5%
prize      = totalPool × 95%
yourShare  = yourBetOnWinTile ÷ totalBetsOnWinTile
yourPayout = prize × yourShare
multiplier = (totalPool × 0.95) ÷ totalBetsOnWinTile
```

| Winning tile % of pool | Multiplier |
|---|---|
| 5% | ~19× |
| 20% | ~4.75× |
| 50% | ~1.9× |

> EV is always −5% regardless of strategy. Fewer tiles = higher variance. More tiles = lower variance. Strategy changes risk, not edge.

---

### 🔀 Drand Randomness  Provably Fair

The winning tile is **not** chosen by the server. It is derived from the Drand randomness beacon at a pre-committed future round number.

```js
// 1. Fetch Drand beacon at round lock time
randomValue = Drand.randomness  // hex string, 256-bit

// 2. Convert to tile (rejection sampling for uniform distribution)
n    = BigInt("0x" + randomValue)
max  = floor(2n**256n / 30n) * 30n      // rejection threshold
// n < max guaranteed uniform
tile = Number(n % 30n) + 1              // result: 1–30

// 3. Anyone can verify
// https://drand.cloudflare.com/public/[DRAND_ROUND_NUMBER]
// Apply same formula → must match winning tile
```

Every ended round shows its Drand round number. Click **Verify** to open the beacon URL and run the formula yourself.

**1,500+ rounds tested. Chi-square p = 0.93. Distribution perfectly uniform across all 30 tiles. ✅**

---

### 🎉 Bonanza Rounds

Occasionally a round is secretly designated as a **Bonanza round** by the protocol. You won't know until it resolves. When a Bonanza round ends, all winners receive:

- ✅ Normal zkLTC payout (same formula)
- ✅ **+10,000 LitDEX Points** on top  awarded on-chain, verifiable by tx hash

Bonanza rounds are revealed with a special animation after resolution and shown with a 🎉 badge in round history.

---

### 🏗️ PVP Architecture

```
pvp/
├── bob-backend/
│   ├── betsonblock.js     Node.js/Express API (port 3005)
│   │                      Round engine: create → lock → Drand fetch → resolve → payout
│   └── betsonblock.db     SQLite  rounds, bets, history
├── pvp-contract/
│   └── contracts/
│       └── BetsOnBlock.sol  On-chain: placeBet, placeBetMulti, resolveRound
└── src/
    └── components/
        ├── PvpPage.tsx        Wheel UI, betting panel, animation engine
        ├── PvpWheelVisual.tsx 30-tile spinning wheel component
        └── BetPanel.tsx       Manual betting: tile select, Even/Odd/All, amount
```

**Stack:** Same as BetsOnBlock  React + TypeScript + Vite + wagmi + viem + RainbowKit
**Backend:** Node.js + Express + SQLite + ethers.js
**Contract:** Solidity 0.8.20, deployed on LiteForge Testnet

---

### 🔌 PVP API Reference

Base URL: `https://lit-api.test-hub.xyz`

| Endpoint | Method | Description |
|---|---|---|
| `/bets/status` | GET | Current round  id, time left, tile pools, Drand target |
| `/bets/place` | POST | Place bet `{ wallet, tile, amount, tx_hash }` |
| `/bets/history` | GET | Last 20 resolved rounds with winning tiles |
| `/bets/round/:id` | GET | Full round details  bets, payouts, Drand verify command |
| `/bets/wallet/:addr` | GET | Wallet bet history + win/loss stats |
| `/bets/health` | GET | Health check |

---

### ⚙️ How PVP Rounds Work

```
T+0:00   Round opens → 90s betting window
T+1:25   Round LOCKS (5s before target) → no new bets
T+1:30   Backend fetches Drand randomness → computes winning tile
         Contract resolveRound(winningTile) called on-chain
         Winners receive zkLTC automatically via contract
T+1:30   10s cooldown → frontend plays wheel spin animation
T+1:40   New round opens → repeat
```

Round timing: **90s betting + 15s cooldown = ~105s per cycle**

---

### 📊 PVP Stats

- 🎯 30 tiles per round  1/30 base probability each
- ⏱️ ~90 second betting window per round
- 💸 On-chain payouts via smart contract  no manual claims
- 🔍 Every round independently verifiable via Drand beacon
- 🎉 Bonanza rounds with LitDEX Points bonus
- 📈 1,500+ rounds completed, chi-square p=0.93 (uniform ✅)
- 🛡️ 5% protocol fee  95% to winners, no hidden fees

---

## 🛣️ Roadmap

- [x] 8 game modes (Coin Flip, Hi-Lo, Lucky Digit, Number 0-99, Txn O/U, Gas O/U, Closest PvP, Perfect Block)
- [x] 5 concurrent live rounds with 3-minute staggered intervals
- [x] Automatic on-chain zkLTC payouts to winners
- [x] Provably fair verification panel  derive signals from any block
- [x] VERIFY button → LiteForge block explorer for every ended round
- [x] Live block ticker + real-time round countdowns
- [x] RainbowKit wallet connect (MetaMask, Rabby, WalletConnect)
- [x] Per-mode help modal with historical stats and AI suggestion
- [x] Winners marquee ticker (live feed of recent wins)
- [x] Bet confirmation toast with round card style
- [x] Ended rounds panel with full result breakdown
- [x] Your Bets  live + ended tabs with win/loss details + payout TX hash
- [x] Arrow carousel navigation for 5 rounds
- [x] `/bettingzone` route with full SPA routing support
- [x] 🎁 Mystery Box  daily reward system with 4 rarities, LitDEX points on-chain
- [x] PVP Tiles  30-tile pool betting with Drand randomness + Bonanza rounds
- [ ] Mainnet migration

---

## 👨‍💻 Built By

**0xDarkSeidBull** ([@LitDEXApp](https://x.com/LitDEXApp))  Solo builder, LitVM ecosystem contributor.

Also building: [**LitDEX**](https://litdex.test-hub.xyz)  All-in-one Web3 Hub on LiteForge (DEX, Social, NFTs, Games, Points).

---

## 📄 License

MIT  see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ on **LiteForge** for the **LiteForge Hackathon**.

</div>
