import { gql, getFootballClubs, getNbaTeams } from "@/lib/sorare";

export const dynamic = "force-dynamic";

const FOOT_STATS = "slug displayName averageScore lastFiveSo5Appearances nextClassicFixtureProjectedScore";
const GAME = "activeInjuries { __typename } nextGame { date homeTeam { name } awayTeam { name } }";
const ODDS = "nextClassicFixturePlayingStatusOdds { starterOddsBasisPoints substituteOddsBasisPoints nonPlayingOddsBasisPoints }";
const NBA_FIELDS = "slug displayName anyPositions averageScore lastFiveSo5Appearances nextClassicFixtureProjectedScore nextDailyFixtureProjectedScore";

async function run(label: string, query: string, pick: (d: any) => any[]): Promise<[string, string]> {
  try {
    const d = await gql(query, 0);
    const nodes = pick(d);
    return [label, `OK, ${nodes.length} Spieler. Erster: ${JSON.stringify(nodes[0] ?? null)}`.slice(0, 800)];
  } catch (e) {
    return [label, `FEHLER: ${(e as Error).message}`];
  }
}

const foot = (slug: string, fields: string, first: number) =>
  `{ football { club(slug: "${slug}") { activePlayers(first: ${first}) { nodes { ${fields} } } } } }`;
const nba = (slug: string, fields: string, first: number) =>
  `{ team(slug: "${slug}") { anyActivePlayers(first: ${first}) { nodes { ${fields} } } } }`;

export default async function Status() {
  const key = process.env.SORARE_API_KEY;
  const results: [string, string][] = [];
  results.push(["API-Key", key ? `gesetzt, Länge ${key.length}` : "NICHT gesetzt"]);
  try {
    const clubs = await getFootballClubs();
    const c = clubs.find((x) => /premier league/i.test(x.league)) ?? clubs[0];
    results.push(["Football-Club", `${c.name} (${c.slug})`]);
    results.push(await run("Football Stats, 5 Spieler", foot(c.slug, FOOT_STATS, 5), (d) => d.football.club.activePlayers.nodes));
    results.push(await run("Football Stats, 100 Spieler", foot(c.slug, FOOT_STATS, 100), (d) => d.football.club.activePlayers.nodes));
    results.push(await run("Football Spiel und Verletzung, 5 Spieler", foot(c.slug, "slug " + GAME, 5), (d) => d.football.club.activePlayers.nodes));
    results.push(await run("Football Einsatzquoten, 5 Spieler", foot(c.slug, "slug " + ODDS, 5), (d) => d.football.club.activePlayers.nodes));
    results.push(await run("Football alles, 100 Spieler", foot(c.slug, `${FOOT_STATS} playingStatus position ${GAME} ${ODDS}`, 100), (d) => d.football.club.activePlayers.nodes));
  } catch (e) {
    results.push(["Football", `FEHLER: ${(e as Error).message}`]);
  }
  try {
    const teams = await getNbaTeams();
    const t = teams[0];
    results.push(["NBA-Team", `${t.name} (${t.slug}), insgesamt ${teams.length} Teams`]);
    results.push(await run("NBA Stats, 5 Spieler", nba(t.slug, NBA_FIELDS, 5), (d) => d.team.anyActivePlayers.nodes));
    results.push(await run("NBA alles, 100 Spieler", nba(t.slug, `${NBA_FIELDS} ${GAME}`, 100), (d) => d.team.anyActivePlayers.nodes));
  } catch (e) {
    results.push(["NBA", `FEHLER: ${(e as Error).message}`]);
  }
  return (
    <main>
      <h1>Status</h1>
      <p>Technischer Test der Sorare-Abfragen. Wird später wieder entfernt.</p>
      {results.map(([n, r]) => (
        <section key={n}>
          <h3>{n}</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r}</pre>
        </section>
      ))}
    </main>
  );
}
