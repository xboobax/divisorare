export type Sport = "football" | "nba";

export type Player = {
  id: string;
  name: string;
  team: string;
  opponent: string;
  home: boolean;
  position: string;          // football: GK/DEF/MID/FWD, nba: G/F/C
  scores: number[];          // letzte Sorare-Scores, neuester zuerst
  playProb: number;          // 0..1 Einsatzwahrscheinlichkeit
  matchup: number;           // 1.0 = neutral, >1 leichter Gegner
  note?: string;             // z.B. Verletzung
};

export type Forecast = Player & { expected: number; low: number; high: number; weighted: number };

export function forecast(p: Player): Forecast {
  const recent = p.scores.slice(0, 10);
  const w = recent.map((_, i) => Math.pow(0.8, i));
  const wsum = w.reduce((a, b) => a + b, 0) || 1;
  const mean = recent.reduce((a, s, i) => a + s * w[i], 0) / wsum;
  const variance = recent.reduce((a, s, i) => a + w[i] * (s - mean) ** 2, 0) / wsum;
  const sd = Math.sqrt(variance);
  const factor = p.matchup * (p.home ? 1.03 : 0.98);
  const expected = Math.max(0, mean * factor);
  return {
    ...p,
    expected,
    low: Math.max(0, expected - sd),
    high: Math.min(100, expected + sd),
    weighted: expected * p.playProb, // Erwartung inkl. Einsatzrisiko
  };
}

export function recommend(players: Forecast[], slots: string[]) {
  const used = new Set<string>();
  const sorted = [...players].sort((a, b) => b.weighted - a.weighted);
  const out: { slot: string; player?: Forecast }[] = [];
  const order = [...slots].sort((a, b) => (a === "FLEX" || a === "ANY" ? 1 : 0) - (b === "FLEX" || b === "ANY" ? 1 : 0));
  for (const slot of order) {
    const pick = sorted.find(
      (p) =>
        !used.has(p.id) &&
        (slot === "ANY" || (slot === "FLEX" ? p.position !== "GK" : p.position === slot))
    );
    if (pick) used.add(pick.id);
    out.push({ slot, player: pick });
  }
  return out;
}
