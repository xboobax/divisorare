export const dynamic = "force-dynamic";

const BASE = "https://api.sorare.com/graphql";

function headers() {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (process.env.SORARE_API_KEY) h["APIKEY"] = process.env.SORARE_API_KEY;
  return h;
}

async function gql(query: string): Promise<any> {
  const res = await fetch(BASE, { method: "POST", headers: headers(), body: JSON.stringify({ query }), cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL-Fehler");
  return json.data;
}

async function safe(query: string): Promise<string> {
  try {
    return JSON.stringify(await gql(query), null, 1).slice(0, 1500);
  } catch (e) {
    return `Fehler: ${(e as Error).message}`;
  }
}

async function loadSchema(): Promise<string> {
  const res = await fetch(BASE + "/schema", { headers: headers(), cache: "no-store" });
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
  const start = lines.findIndex((l) => new RegExp(`^(type|interface|input|enum) ${name}[ {]`).test(l));
  if (start < 0) return null;
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length && lines[i] !== "}"; i++) out.push(lines[i]);
  return out;
}

function returnType(line: string): string | null {
  const m = line.match(/:\s*\[?([A-Za-z0-9_]+)[!\]]*\s*$/);
  return m ? m[1] : null;
}

const cap = (lines: string[]) => lines.join("\n").slice(0, 3500);

async function smoke(): Promise<[string, string][]> {
  const out: [string, string][] = [];
  out.push(["Test Spielwoche", await safe(`{ football { so5 { so5Fixtures(aasmStates: ["opened"], first: 1) { nodes { slug gameWeek cutOffDate } } } } }`)]);
  let slug = "";
  try {
    const d = await gql(`{ football { clubsReady { slug name } } }`);
    const list: any[] = d?.football?.clubsReady ?? [];
    slug = list[0]?.slug ?? "";
    out.push(["Test alle Clubs", `${list.length} Clubs gefunden. Beispiele: ${list.slice(0, 5).map((c) => c.name).join(", ")}`]);
  } catch (e) {
    out.push(["Test alle Clubs", `Fehler: ${(e as Error).message}`]);
  }
  if (/^[a-z0-9-]+$/.test(slug)) {
    out.push(["Test Spieler eines Clubs", await safe(`{ football { club(slug: "${slug}") { name activePlayers(first: 3) { nodes { slug displayName position playingStatus } } } } }`)]);
  }
  return out;
}

export default async function Diagnose({ searchParams }: { searchParams: { t?: string } }) {
  const tests = await smoke();
  const sections: [string, string][] = [];
  let error = "";
  try {
    const schema = await loadSchema();
    const q = block(schema, "Query") ?? [];
    const rootLines = q.filter((l) => /^(football|nba|baseball)\b/i.test(l));
    sections.push(["Query (nur football/nba)", rootLines.join("\n") || "nichts gefunden"]);
    const shown = new Set<string>();
    const queue: string[] = [];
    for (const l of rootLines) { const t = returnType(l); if (t) queue.push(t); }
    if (searchParams.t) for (const n of searchParams.t.split(",")) if (/^[A-Za-z0-9_]+$/.test(n.trim())) queue.push(n.trim());
    const want = /^(player|players|club|clubs|clubsReady|team|teams|game|games|competition|competitions|fixture|fixtures|so5)\b/i;
    while (queue.length && shown.size < 10) {
      const n = queue.shift() as string;
      if (shown.has(n)) continue;
      shown.add(n);
      const b = block(schema, n);
      sections.push([n, b ? cap(b) : "Typ nicht vorhanden"]);
      if (b && shown.size <= 3) for (const l of b) if (want.test(l)) { const t = returnType(l); if (t && !shown.has(t)) queue.push(t); }
    }
    const nbaNames = Array.from(schema.matchAll(/^(?:type|interface|enum|input) ([A-Za-z0-9_]+)/gm)).map((m) => m[1]).filter((n) => /nba/i.test(n));
    sections.push(["Typen mit NBA im Namen", nbaNames.slice(0, 150).join(", ")]);
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <main>
      <h1>Diagnose</h1>
      <p>Technische Übersicht der Sorare-Schnittstelle. Wird später wieder entfernt.</p>
      <h2>Live-Tests</h2>
      {tests.map(([n, r]) => (<section key={n}><h3>{n}</h3><pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r}</pre></section>))}
      <h2>Felder</h2>
      {error && <p>Fehler: {error}</p>}
      {sections.map(([n, r]) => (<section key={n}><h3>{n}</h3><pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r}</pre></section>))}
    </main>
  );
}
