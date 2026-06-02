/** api.ts — thin client for the BetsOnBlock backend. */

export type RoundView = {
  id: number;
  status: "open" | "locked" | "settling" | "settled";
  openAt: number; lockAt: number; settleAt: number;
  msToLock: number; msToSettle: number;
  targetBlock: { number: number; hash: string; txCount: number; gasUsed: string } | null;
  result: any | null;
  totalBets: number; totalStaked: number; players: number;
  pools?: Array<{ mode: string; pick: string; stake: number; players: number }>;
};

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    let msg = `http_${r.status}`;
    try { const e = await r.json(); msg = e.error || msg; } catch { /* */ }
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  rounds: () => j<{ rounds: RoundView[] }>("/api/rounds"),
  history: (n = 20) => j<{ history: RoundView[] }>(`/api/history?n=${n}`),
  head: () => j<{ block: number }>("/api/head"),
  verify: (block: number) => j<{ block: any; signals: any }>(`/api/verify/${block}`),
  bet: (body: { wallet: string; roundId: number; mode: string; pick: string; stake: number }) =>
    j<{ ok: boolean; error?: string; round?: RoundView }>("/api/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
