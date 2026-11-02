import { Player, Sport } from "./model";

// Deterministischer Zufall, damit die Demo bei jedem Aufruf gleich aussieht
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function make(sport: Sport): Player[] {
  const r = rng(sport === "nba" ? 7 : 3);
  const pos = sport === "nba" ? ["G", "G", "F", "F", "C"] : ["GK", "DEF", "DEF", "MID", "MID", "FWD", "FWD"];
  const n = sport === "nba" ? 15 : 21;
  return Array.from({ length: n }, (_, i) => {
    const base = 25 + r() * 45;
    return {
      id: `${sport}-${i}`,
      name: `Demo-Spieler ${i + 1}`,
      team: `Team ${String.fromCharCode(65 + (i % 8))}`,
      opponent: `Team ${String.fromCharCode(65 + ((i + 3) % 8))}`,
      home: r() > 0.5,
      position: pos[i % pos.length],
      scores: Array.from({ length: 10 }, () => Math.round(Math.max(0, Math.min(100, base + (r() - 0.5) * 40)))),
      playProb: Math.round((0.55 + r() * 0.45) * 100) / 100,
      matchup: Math.round((0.9 + r() * 0.2) * 100) / 100,
      note: r() > 0.9 ? "fraglich" : undefined,
    };
  });
}

export const demoPlayers = (s: Sport) => make(s);
