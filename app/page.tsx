import Link from "next/link";
import { getData } from "@/lib/data";
import { forecast, recommend, Sport } from "@/lib/model";
import { DIVINATION } from "@/config/divination";

export const revalidate = 300; // Seite alle 5 Minuten neu erzeugen

type Props = { searchParams: { sport?: string; pos?: string } };
const POS_LABEL: Record<string, string> = { GK: "Torwart", DEF: "Abwehr", MID: "Mittelfeld", FWD: "Sturm", FLEX: "Feldspieler", ANY: "Beliebig", G: "Guard", F: "Forward", C: "Center" };
const fmt = (n: number) => n.toFixed(1).replace(".", ",");

export default async function Page({ searchParams }: Props) {
  const sport: Sport = searchParams.sport === "nba" ? "nba" : "football";
  const pos = searchParams.pos ?? "all";
  const { players, fixture, liveStatus } = await getData(sport);
  const all = players.map(forecast).sort((a, b) => b.weighted - a.weighted);
  const slots = sport === "nba" ? DIVINATION.nba.slots : DIVINATION.football.slots;
  const lineup = recommend(all, slots);
  const lineupTotal = lineup.reduce((a, l) => a + (l.player?.weighted ?? 0), 0);
  const positions = Array.from(new Set(players.map((p) => p.position)));
  const shown = pos === "all" ? all : all.filter((p) => p.position === pos);
  const q = (s: string, p: string) => `/?sport=${s}&pos=${p}`;

  return (
    <main>
      <header>
        <h1>Divination Planer</h1>
        <nav aria-label="Sportart">
          <Link href={q("football", "all")} aria-current={sport === "football"}>Football</Link>
          <Link href={q("nba", "all")} aria-current={sport === "nba"}>NBA</Link>
        </nav>
      </header>

      <section className="status">
        {!DIVINATION.rulesVerified && (
          <p className="warn">Die Divination-Regeln sind nicht offiziell bestätigt. Aufstellung und Wertung beruhen auf Annahmen (siehe config/divination.ts).</p>
        )}
        <p>Datenstand: {liveStatus}.{fixture?.gameWeek ? ` Nächster Gameweek: ${fixture.gameWeek}.` : ""}</p>
      </section>

      <section>
        <h2>Empfohlene Aufstellung</h2>
        <p className="sub">Erwartete Punkte inklusive Einsatzrisiko: <strong>{fmt(lineupTotal)}</strong></p>
        <ol className="lineup">
          {lineup.map((l, i) => (
            <li key={i}>
              <span className="slot">{POS_LABEL[l.slot] ?? l.slot}</span>
              {l.player ? (<><span className="nm">{l.player.name}<small>{l.player.team} gegen {l.player.opponent}</small></span><span className="num">{fmt(l.player.weighted)}</span></>) : <span className="nm muted">Kein Spieler verfügbar</span>}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Alle Spieler</h2>
        <div className="filters">
          <Link href={q(sport, "all")} aria-current={pos === "all"}>Alle</Link>
          {positions.map((p) => (<Link key={p} href={q(sport, p)} aria-current={pos === p}>{POS_LABEL[p] ?? p}</Link>))}
        </div>
        <div className="scroll">
          <table>
            <thead><tr><th>Spieler</th><th>Position</th><th>Spielt</th><th>Prognose (Spannweite)</th><th className="r">Erwartet</th><th>Letzte 5</th></tr></thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><small>{p.team} {p.home ? "zuhause gegen" : "auswärts bei"} {p.opponent}{p.note ? ` · ${p.note}` : ""}</small></td>
                  <td>{POS_LABEL[p.position] ?? p.position}</td>
                  <td><div className="prob"><i style={{ width: `${p.playProb * 100}%` }} /></div><small>{Math.round(p.playProb * 100)} %</small></td>
                  <td><div className="range" role="img" aria-label={`von ${Math.round(p.low)} bis ${Math.round(p.high)}`}><i style={{ left: `${p.low}%`, width: `${Math.max(2, p.high - p.low)}%` }} /><b style={{ left: `${p.expected}%` }} /></div></td>
                  <td className="r num">{fmt(p.weighted)}</td>
                  <td className="num">{p.scores.slice(0, 5).join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
