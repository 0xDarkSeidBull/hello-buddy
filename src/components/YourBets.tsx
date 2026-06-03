import React from "react";
import { Wallet2 } from "lucide-react";

type Bet = {
  roundId: number;
  block: number;
  mode: string;
  pick: string;
  stake: number;
  win: boolean;
  payout: number;
  settledAt: number;
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

export default function YourBets({ addr }: { addr: string | null }) {
  const [bets, setBets] = React.useState<Bet[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!addr) { setBets([]); return; }
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API_BASE}/api/bets/${addr}`);
        if (!r.ok) return;
        const j = await r.json();
        if (alive) setBets(j.bets || []);
      } catch { /* */ }
      finally { if (alive) setLoading(false); }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [addr]);

  const totalWon = bets.filter(b => b.win).reduce((s, b) => s + (b.payout || 0), 0);
  const totalLost = bets.filter(b => !b.win).reduce((s, b) => s + (b.stake || 0), 0);

  return (
    <div className="your-bets">
      <div className="side-head"><Wallet2 size={15} /> Your Bets</div>

      {!addr ? (
        <div className="empty sm">Connect wallet to see your bets.</div>
      ) : (
        <>
          <div className="yb-summary">
            <div className="yb-stat win">
              <span className="k">Won</span>
              <span className="v">◆ {totalWon.toFixed(4)}</span>
            </div>
            <div className="yb-stat loss">
              <span className="k">Lost</span>
              <span className="v">◆ {totalLost.toFixed(4)}</span>
            </div>
          </div>

          {bets.length === 0 ? (
            <div className="empty sm">{loading ? "Loading…" : "No bets yet"}</div>
          ) : (
            <div className="yb-table">
              <div className="yb-row yb-head">
                <span>Block</span><span>Mode</span><span>Picked</span>
                <span>Result</span><span>Stake</span><span>Payout</span>
              </div>
              {bets.map((b, i) => (
                <div key={i} className={`yb-row ${b.win ? "win" : "loss"}`}>
                  <span className="mono">#{b.block}</span>
                  <span>{b.mode}</span>
                  <span>{b.pick}</span>
                  <span>{b.win ? "WIN" : "LOSS"}</span>
                  <span>◆ {b.stake.toFixed(4)}</span>
                  <span>◆ {(b.payout || 0).toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
