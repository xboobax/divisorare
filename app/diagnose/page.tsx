export const dynamic = "force-dynamic";

const BASE = "https://api.sorare.com/graphql";

async function loadSchema(): Promise<string> {
  const h: Record<string, string> = {};
  if (process.env.SORARE_API_KEY) h["APIKEY"] = process.env.SORARE_API_KEY;
  const res = await fetch(BASE + "/schema", { headers: h, cache: "no-store" });
  if (!res.ok) throw new Error(`Schema-Download: HTTP ${res.status}`);
  const raw = await res.text();
  return raw
    .replace(/"""[\s\S]*?"""/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l !== "" && !/^"[^"]*"$/.test(l))
    .join("\n");
}

function block(schema: string, name: string): string[] | null {
  const lines = schema.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^(type|interface|input|enum|union) ${name}[ {=]`).test(l));
  if (start < 0) return null;
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length && lines[i] !== "}"; i++) out.push(lines[i]);
  return out;
}

// Entfernt die Argument-Listen, damit nur "feld: Typ" übrig bleibt
function compact(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^([A-Za-z0-9_]+)\($/);
    if (open) {
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith(")")) j++;
      out.push(open[1] + (lines[j] ?? "").replace(/^\)/, ""));
      i = j;
      continue;
    }
    out.push(lines[i].replace(/\([^)]*\)/, ""));
  }
  return out;
}

const WANTED = ["Query", "Player", "So5Score", "NBAPlayer", "AnyPlayerInterface", "So5Fixture", "PlayerGameScoreInterface", "NBACard"];

export default async function Diagnose({ searchParams }: { searchParams: { t?: string } }) {
  const sections: [string, string][] = [];
  let error = "";
  try {
    const schema = await loadSchema();
    const extra = (searchParams.t ?? "").split(",").map((n) => n.trim()).filter((n) => /^[A-Za-z0-9_]+$/.test(n));
    for (const n of [...WANTED, ...extra]) {
      const b = block(schema, n);
      sections.push([n, b ? compact(b).join("\n").slice(0, 7000) : "Typ nicht vorhanden"]);
    }
    const names = Array.from(schema.matchAll(/^(?:type|interface|enum|union) ([A-Za-z0-9_]+)/gm))
      .map((m) => m[1])
      .filter((n) => /so5|fixture|nba|score|lineup/i.test(n));
    sections.push(["Typnamen (So5/Fixture/NBA/Score)", names.slice(0, 300).join(", ")]);
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <main>
      <h1>Diagnose</h1>
      <p>Technische Übersicht der Sorare-Schnittstelle. Wird später wieder entfernt.</p>
      {error && <p>Fehler: {error}</p>}
      {sections.map(([n, r]) => (
        <section key={n}>
          <h3>{n}</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r}</pre>
        </section>
      ))}
    </main>
  );
}
