import { Player, Sport } from "./model";

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

// Nur noch für NBA, bis die NBA-Daten angebunden sind. Alles erfunden.
export function demoPlayers(sport: Sport): Player[] {
  const r = rng(sport === "nba" ? 7 : 3);
  const pos = ["G", "G", "F", "F", "C"];
  return Array.from({ length: 15 }, (_, i) => {
    const base = 25 + r() * 45;
    return {
      id: `${sport}-${i}`,
      name: `Demo-Spieler ${i + 1}`,
      team: `Team ${String.fromCharCode(65 + (i % 8))}`,
      position: pos[i % pos.length],
      avg: Math.round(base * 10) / 10,
      proj: Math.round(base * (0.9 + r() * 0.2) * 10) / 10,
      last5Apps: 3 + Math.floor(r() * 3),
      status: "DEMO",
      injuries: 0,
      hasGame: true,
    };
  });
}
