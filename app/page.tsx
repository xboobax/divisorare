import Link from "next/link";
import { getFootballClubs, getPlayers, Club } from "@/lib/sorare";
import { demoPlayers } from "@/lib/demo";
import { forecast, recommend, Player, Sport } from "@/lib/model";
import { DIVINATION } from "@/config/divination";

export const revalidate = 300;
export const maxDuration = 60;

type Props = { searchParams: { sport?: string; league?: string; team?: string; pos?: string } };
const POS_LABEL: Record<string, string> = { GK: "Torwart", DEF: "Abwehr", MID: "Mittelfeld", FWD: "Sturm", FLEX: "Feldspieler", ANY: "Beliebig", G: "Guard", F: "Forward", C: "Center" };
const fmt = (n: number | null) => (n === null ? "–" : n.toFixed(1).replace(".", ","));
const href = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const k of Object.keys(o)) if (o[k]) p.set(k, o[k] as string);
  return "/?" + p.toString();
};

export default async function Page({ searchParams }: Props) {
  const sport: Sport = searchParams.sport === "nba" ? "nba" : "football";
  const pos = searchParams.pos ?? "all";
  const team = searchParams.team ?? "";
  let players: Player[] = [];
  let clubs: Club[] = [];
  let leagues: string[] = [];
  let league = "";
  let info = "";
  let error = "";

  if (sport === "football") {
    try {
      clubs = await getFootballClubs();
      leagues = Array.from(new Set(clubs.map((c) => c.league))).sort((a, b) => a.localeCompare(b));
      league = searchParams.league ?? leagues.find((l) => /^premier league$/i.test(l)) ?? leagues[0] ?? "";
      const scope = team ? clubs.filter((c) => c.slug === team) : league === "__all" ? clubs : clubs.filter((c) => c.league === league);
      const r = await getPlayers(scope);
      players = r.players;
      info = `Live von Sorare: ${r.players.length} Spieler aus ${scope.length - r.failed} von ${scope.length} Clubs.`;
      if (r.failed) info += ` ${r.failed} Clubs konnten nicht geladen werden (Limit oder Zeit). Bitte in ein bis zwei Minuten neu laden, geladene Clubs sind dann zwischengespeichert.`;
    } catch (e) {
      error = `Sorare nicht erreichbar: ${(e as Error).message}`;
    }
  } else {
    players = demoPlayers("nba");
    info = "NBA: noch Demo-Daten (erfunden). Die NBA-Anbindung folgt im nächsten Schritt.";
  }

  const all = players.map(forecast).sort((a, b) => b.weighted - a.weighted);
  const slots = sport === "nba" ? DIVINATION.nba.slots : DIVINATION.football.slots;
  const lineup = recommend(all, slots);
  const lineupTotal = lineup.reduce((a, l) => a + (l.player?.weighted ?? 0), 0);
  const positions = Array.from(new Set(players.map((p) => p.position))).sort();
  const filtered = pos === "all" ? all : all.filter((p) => p.position === pos);
  const shown = filtered.slice(0, 150);
  const leagueClubs = clubs.filter((c) => c.league === league);
  const base = { sport, league: league || undefined, team: team || undefined };

  return (
    <main>
      <header>
        <h1>Divination Planer</h1>
        <nav aria-label="Sportart">
          <Link href={href({ sport: "football" })} aria-current={sport === "football"}>Football</Link>
          <Link href={href({ sport: "nba" })} aria-current={sport === "nba"}>NBA</Link>
        </nav>
      </header>

      <section className="status">
        {!DIVINATION.rulesVerified && (
          <p className="warn">Die Divination-Regeln sind nicht offiziell bestätigt. Aufstellung und Wertung beruhen auf Annahmen (siehe config/divination.ts).</p>
        )}
        {error ? <p className="warn">{error}</p> : <p>{info}</p>}
        <p>Prognose = Mittel aus Sorare-Projektion und Durchschnittsscore, multipliziert mit der geschätzten Einsatzchance.</p>
      </section>

      {sport === "football" && leagues.length > 0 && (
        <section>
          <h2>Liga wählen</h2>
          <div className="filters">
            <Link href={href({ sport, league: "__all" })} aria-current={league === "__all" && !team}>Alle Ligen (lädt lange)</Link>
            {leagues.map((l) => (<Link key={l} href={href({ sport, league: l })} aria-current={l === league && !team}>{l}</Link>))}
          </div>
          {league && league !== "__all" && (
            <div className="filters">
              {leagueClubs.map((c) => (<Link key={c.slug} href={href({ sport, league, team: c.slug })} aria-current={c.slug === team}>{c.name}</Link>))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2>Empfohlene Aufstellung</h2>
        <p className="sub">Erwartete Punkte inklusive Einsatzrisiko: <strong>{fmt(lineupTotal)}</strong></p>
        <ol className="lineup">
          {lineup.map((l, i) => (
            <li key={i}>
              <span className="slot">{POS_LABEL[l.slot] ?? l.slot}</span>
              {l.player ? (<><span className="nm">{l.player.name}<small>{l.player.team}{l.player.nextGame ? ` · ${l.player.nextGame}` : ""}</small></span><span className="num">{fmt(l.player.weighted)}</span></>) : <span className="nm muted">Kein Spieler verfügbar</span>}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Spieler ({filtered.length})</h2>
        <div className="filters">
          <Link href={href(base)} aria-current={pos === "all"}>Alle</Link>
          {positions.map((p) => (<Link key={p} href={href({ ...base, pos: p })} aria-current={pos === p}>{POS_LABEL[p] ?? p}</Link>))}
        </div>
        {filtered.length > shown.length && <p className="sub">Angezeigt werden die besten {shown.length}. Wähle eine Liga, einen Club oder eine Position für mehr.</p>}
        <div className="scroll">
          <table>
            <thead><tr><th>Spieler</th><th>Position</th><th>Einsatz</th><th>Prognose</th><th className="r">Sorare-Proj.</th><th className="r">Ø</th><th className="r">Erwartet</th></tr></thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><small>{p.team}{p.injuries ? " · verletzt" : ""}{p.hasGame === false ? " · kein Spiel" : ""}</small></td>
                  <td>{POS_LABEL[p.position] ?? p.position}</td>
                  <td><div className="prob"><i style={{ width: `${p.playProb * 100}%` }} /></div><small>{Math.round(p.playProb * 100)} % · {p.status || "unbekannt"}</small></td>
                  <td><div className="range" role="img" aria-label={`erwartet ${Math.round(p.expected)}`}><b style={{ left: `${Math.min(100, p.expected)}%` }} /></div></td>
                  <td className="r num">{fmt(p.proj)}</td>
                  <td className="r num">{fmt(p.avg)}</td>
                  <td className="r num"><strong>{fmt(p.weighted)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
