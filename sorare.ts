// Alle Sorare-Abfragen stehen nur in dieser Datei.
import { Player } from "./model";

const API = "https://api.sorare.com/graphql";

export async function gql(query: string, revalidate: number): Promise<any> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.SORARE_API_KEY) headers["APIKEY"] = process.env.SORARE_API_KEY;
  const res = await fetch(API, { method: "POST", headers, body: JSON.stringify({ query }), next: { revalidate } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`HTTP 422: ${json.errors[0]?.message ?? "GraphQL-Fehler"}`);
  return json.data;
}

export type Club = { slug: string; name: string; league: string };

export async function getFootballClubs(): Promise<Club[]> {
  const d = await gql(`{ football { clubsReady { slug name domesticLeague { displayName } } } }`, 3600);
  return (d.football.clubsReady as any[])
    .map((c) => ({ slug: String(c.slug), name: String(c.name), league: c.domesticLeague?.displayName ?? "Ohne Liga" }))
    .filter((c) => /^[a-z0-9-]+$/.test(c.slug));
}

// Die Felder sind in Stufen angelegt: Falls Sorare ein Feld nicht (mehr) kennt,
// fällt der Abruf automatisch auf die nächstkleinere Stufe zurück.
const CORE = "slug displayName position playingStatus";
const STATS = "averageScore lastFiveSo5Appearances nextClassicFixtureProjectedScore";
const EXTRA = "activeInjuries { __typename } nextGame { date homeTeam { name } awayTeam { name } }";
const TIERS = [`${CORE} ${STATS} ${EXTRA}`, `${CORE} ${STATS}`, CORE];
let tier = 0;

const POS: Record<string, string> = { Goalkeeper: "GK", Defender: "DEF", Midfielder: "MID", Forward: "FWD" };
const num = (x: unknown): number | null => (typeof x === "number" && isFinite(x) ? x : null);

function toPlayer(n: any, club: Club): Player {
  const g = n.nextGame;
  return {
    id: String(n.slug),
    name: String(n.displayName),
    team: club.name,
    teamSlug: club.slug,
    position: POS[n.position] ?? String(n.position ?? "?"),
    avg: num(n.averageScore),
    proj: num(n.nextClassicFixtureProjectedScore),
    last5Apps: num(n.lastFiveSo5Appearances),
    status: String(n.playingStatus ?? ""),
    injuries: Array.isArray(n.activeInjuries) ? n.activeInjuries.length : 0,
    hasGame: g === undefined ? null : g !== null,
    nextGame: g ? `${String(g.date).slice(0, 10)} ${g.homeTeam?.name ?? "?"} - ${g.awayTeam?.name ?? "?"}` : undefined,
  };
}

export async function getClubPlayers(club: Club): Promise<Player[]> {
  for (;;) {
    try {
      const d = await gql(
        `{ football { club(slug: "${club.slug}") { activePlayers(first: 100) { nodes { ${TIERS[tier]} } } } } }`,
        900
      );
      return (d.football.club.activePlayers.nodes as any[]).map((n) => toPlayer(n, club));
    } catch (e) {
      const msg = (e as Error).message;
      if (!msg.startsWith("HTTP 422") || tier >= TIERS.length - 1) throw e;
      tier++;
    }
  }
}

export async function getPlayers(clubs: Club[]): Promise<{ players: Player[]; failed: number }> {
  const players: Player[] = [];
  let failed = 0;
  const run = async (batch: Club[]) => {
    const res = await Promise.all(batch.map((c) => getClubPlayers(c).catch(() => null)));
    for (const r of res) (r ? players.push(...r) : failed++);
  };
  const queue = [...clubs];
  if (queue.length) await run(queue.splice(0, 1)); // erster Club legt die passende Feld-Stufe fest
  while (queue.length) await run(queue.splice(0, 6));
  return { players, failed };
}
