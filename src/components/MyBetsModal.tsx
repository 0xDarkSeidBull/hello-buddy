import React from "react";
import { ChevronDown, ChevronRight, History as HistoryIcon, X, Loader2 } from "lucide-react";

const HISTORY_URL = "https://lit-api.test-hub.xyz/bets/history";
const PAGE_SIZE = 10;

type RawBet = { wallet?: string; tile?: number | string; amount?: number | string; tx_hash?: string };
type RawPayout = { wallet?: string; bet?: number | string; payout?: number | string };
type RawRound = {
  id?: number | string;
  round_id?: number | string;
  status?: string;
  winning_tile?: number | string;
  total_pool?: number | string;
  bets?: RawBet[];
  payouts?: RawPayout[];
};

type MyRound = {
  id: number;
  winning_tile: number;
  total_pool: number;
  myBets: { tile: number; amount: number; tx_hash?: string }[];
  totalSpent: number;
  totalWon: number;
  net: number;
};

const num = (v: any, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const netColor = (net: number) =>
  net > 0 ? "#22c55e" : net < 0 ? "#ef4444" : "#9ca3af";

function netLabel(net: number) {
  if (net > 0) return `+${net.toFixed(3)} zkLTC ✅`;
  if (net < 0) return `${net.toFixed(3)} zkLTC ❌`;
  return `0 zkLTC`;
}

export default function MyBetsModal({
  address,
  refreshKey,
}: {
  address: string | null;
  refreshKey: number | string;
}) {
  const [open, setOpen] = React.useState(false);
  const [rounds, setRounds] = React.useState<MyRound[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  const fetchHistory = React.useCallback(async () => {
    if (!address) { setRounds([]); return; }
    const addr = address.toLowerCase();
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(HISTORY_URL, { cache: "no-store" });
      if (!r.ok) throw new Error(`http_${r.status}`);
      const j = await r.json();
      const arr: RawRound[] = Array.isArray(j) ? j : (j.history || j.rounds || []);
      const myRounds: MyRound[] = [];
      for (const raw of arr) {
        const id = num(raw.round_id ?? raw.id, NaN);
        if (!Number.isFinite(id)) continue;
        const myBets = (raw.bets || [])
          .filter((b) => (b.wallet || "").toLowerCase() === addr)
          .map((b) => ({ tile: num(b.tile), amount: num(b.amount), tx_hash: b.tx_hash }));
        if (myBets.length === 0) continue;
        const totalSpent = myBets.reduce((s, b) => s + b.amount, 0);
        const totalWon = (raw.payouts || [])
          .filter((p) => (p.wallet || "").toLowerCase() === addr)
          .reduce((s, p) => s + num(p.payout), 0);
        myRounds.push({
          id,
          winning_tile: num(raw.winning_tile),
          total_pool: num(raw.total_pool),
          myBets,
          totalSpent,
          totalWon,
          net: totalWon - totalSpent,
        });
      }
      myRounds.sort((a, b) => b.id - a.id);
      setRounds(myRounds);
    } catch (e: any) {
      setErr(e?.message || "fetch failed");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Fetch on open
  React.useEffect(() => { if (open) fetchHistory(); }, [open, fetchHistory]);
  // Re-fetch after bet placement, only if modal is open
  React.useEffect(() => { if (open) fetchHistory(); }, [refreshKey]); // eslint-disable-line

  const totalPages = Math.max(1, Math.ceil(rounds.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRounds = rounds.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = React.useMemo(() => {
    const spent = rounds.reduce((s, r) => s + r.totalSpent, 0);
    const won = rounds.reduce((s, r) => s + r.totalWon, 0);
    return { spent, won, net: won - spent };
  }, [rounds]);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#0d0d0d", color: "#fff",
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: 10, padding: "8px 14px",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
          fontFamily: "'Space Grotesk',system-ui,sans-serif",
          boxShadow: "2px 2px 0 0 rgba(15,23,42,.9)",
        }}
      >
        <HistoryIcon size={14} /> My Bets
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(820px, 100%)", maxHeight: "90vh",
              background: "#0d0d0d", color: "#fff",
              border: "1px solid rgba(255,255,255,.12)", borderRadius: 16,
              boxShadow: "0 30px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(124,92,255,.15)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              fontFamily: "'Space Grotesk',system-ui,sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.08)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 800, letterSpacing: ".04em" }}>
                <HistoryIcon size={18} /> My Bets
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.15)",
                  color: "#fff", borderRadius: 10, padding: 6, cursor: "pointer",
                  display: "inline-flex",
                }}
              ><X size={16} /></button>
            </div>

            {/* Summary bar */}
            {address && rounds.length > 0 && (
              <div style={{
                padding: "12px 20px",
                borderBottom: "1px solid rgba(255,255,255,.08)",
                display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12,
                fontSize: 12,
              }}>
                <SummaryCell label="Rounds" value={String(rounds.length)} />
                <SummaryCell label="Spent" value={`${totals.spent.toFixed(3)} zkLTC`} />
                <SummaryCell label="Won" value={`${totals.won.toFixed(3)} zkLTC`} />
                <SummaryCell label="Net" value={netLabel(totals.net)} color={netColor(totals.net)} />
              </div>
            )}

            {/* Body */}
            <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
              {!address ? (
                <Empty>Connect wallet to see your bets</Empty>
              ) : loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 8, color: "#9ca3af" }}>
                  <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  Loading…
                </div>
              ) : err ? (
                <Empty color="#ef4444">Failed to load: {err}</Empty>
              ) : rounds.length === 0 ? (
                <Empty>No bets yet</Empty>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pageRounds.map((r) => {
                    const isOpen = expanded.has(r.id);
                    return (
                      <div key={r.id} style={{
                        background: "#161616",
                        border: "1px solid rgba(255,255,255,.08)",
                        borderRadius: 12, overflow: "hidden",
                      }}>
                        <button
                          onClick={() => toggle(r.id)}
                          style={{
                            width: "100%", background: "transparent", border: "none",
                            padding: "12px 14px", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: 10, color: "#fff", fontWeight: 700, textAlign: "left",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13,
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Round #{r.id}
                          </span>
                          <span>🏆 Tile <span style={{ color: "#22c55e", fontWeight: 900 }}>{r.winning_tile}</span></span>
                          <span style={{ color: "#9ca3af" }}>{r.myBets.length} tile{r.myBets.length === 1 ? "" : "s"}</span>
                          <span style={{ color: netColor(r.net), fontWeight: 800 }}>Net: {netLabel(r.net)}</span>
                        </button>

                        {isOpen && (
                          <div style={{
                            padding: "12px 14px 14px",
                            borderTop: "1px dashed rgba(255,255,255,.10)",
                            background: "rgba(255,255,255,.02)",
                          }}>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
                              Winning tile: <span style={{ color: "#22c55e", fontWeight: 900 }}>{r.winning_tile}</span>
                              {" · "}Pool: <b style={{ color: "#fff" }}>{r.total_pool.toFixed(3)} zkLTC</b>
                            </div>
                            <div style={{
                              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4,
                              fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            }}>
                              <THead>Tile</THead><THead>Amount</THead><THead>Result</THead>
                              {r.myBets.map((b, i) => {
                                const won = b.tile === r.winning_tile;
                                return (
                                  <React.Fragment key={i}>
                                    <TCell>{b.tile}</TCell>
                                    <TCell>{b.amount.toFixed(3)}</TCell>
                                    <TCell color={won ? "#22c55e" : "#ef4444"}>
                                      {won ? "✅ WON" : "❌ LOST"}
                                    </TCell>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                            <div style={{ marginTop: 12, fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                              <span style={{ color: "#9ca3af" }}>Spent: <b style={{ color: "#fff" }}>{r.totalSpent.toFixed(3)} zkLTC</b></span>
                              <span style={{ color: "#9ca3af" }}>Won: <b style={{ color: "#fff" }}>{r.totalWon.toFixed(3)} zkLTC</b></span>
                              <span style={{ color: netColor(r.net), fontWeight: 800 }}>
                                Net: {netLabel(r.net)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {address && rounds.length > PAGE_SIZE && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, padding: "12px 20px",
                borderTop: "1px solid rgba(255,255,255,.08)",
              }}>
                <PagerBtn disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</PagerBtn>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>
                  Page {safePage} of {totalPages}
                </span>
                <PagerBtn disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</PagerBtn>
              </div>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </>
  );
}

function SummaryCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: "#161616", border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 10, padding: "8px 10px",
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>{label}</span>
      <b style={{ color: color || "#fff", fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{value}</b>
    </div>
  );
}
function Empty({ children, color }: { children: React.ReactNode; color?: string }) {
  return <div style={{ padding: 40, textAlign: "center", color: color || "#9ca3af", fontSize: 13 }}>{children}</div>;
}
function THead({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 800, color: "#fff", padding: "4px 6px", borderBottom: "1px solid rgba(255,255,255,.10)" }}>{children}</div>;
}
function TCell({ children, color }: { children: React.ReactNode; color?: string }) {
  return <div style={{ padding: "4px 6px", color: color || "#fff", fontWeight: color ? 800 : 500 }}>{children}</div>;
}
function PagerBtn({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        background: "transparent", border: "1px solid rgba(255,255,255,.18)",
        color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 14px",
        borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1, fontFamily: "inherit",
      }}
    >{children}</button>
  );
}
