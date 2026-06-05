import React from "react";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

type Stats = { totalBets: number; totalWon: number; totalLoss: number };

export default function HeaderStats() {
  const [stats, setStats] = React.useState<Stats>({ totalBets: 0, totalWon: 0, totalLoss: 0 });

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/stats`);
        if (!r.ok) return;
        const j = await r.json();
        if (!alive) return;
        const num = (v: any) => {
          const n = typeof v === "string" ? Number(v) : (typeof v === "number" ? v : 0);
          return Number.isFinite(n) ? n : 0;
        };
        setStats({
          totalBets: num(j.totalBets ?? j.total_bets ?? j.bets),
          totalWon: num(j.totalWon ?? j.total_won ?? j.won ?? j.wins),
          totalLoss: num(j.totalLoss ?? j.total_loss ?? j.loss ?? j.losses ?? j.losts),
        });
      } catch { /* */ }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const cell = (label: string, value: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 14px", lineHeight: 1.1 }}>
      <span style={{
        fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase",
        color: "var(--muted, #9ca3af)", fontWeight: 700, marginBottom: 3,
      }}>{label}</span>
      <span style={{
        fontSize: 15, fontWeight: 900, color: "#fff",
        fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-.01em",
      }}>{value.toLocaleString()}</span>
    </div>
  );

  const divider = (
    <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.14)" }} />
  );

  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.10)",
      borderRadius: 12, padding: "6px 4px",
    }}>
      {cell("Total Bets", stats.totalBets)}
      {divider}
      {cell("Total Won", stats.totalWon)}
      {divider}
      {cell("Total Loss", stats.totalLoss)}
    </div>
  );
}
