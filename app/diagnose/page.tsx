export const dynamic = "force-dynamic";

const API = "https://api.sorare.com/graphql";
const TYPES = ["Query", "Football", "Player", "Club", "NBAPlayer", "NBATeam", "NBAGame"];

function typeName(x: any): string {
  return x ? (x.name ?? `${x.kind}(${typeName(x.ofType)})`) : "";
}

async function inspect(name: string): Promise<string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.SORARE_API_KEY) headers["APIKEY"] = process.env.SORARE_API_KEY;
  const query = `{ __type(name: "${name}") { fields { name type { name kind ofType { name kind ofType { name kind } } } } } }`;
  try {
    const res = await fetch(API, { method: "POST", headers, body: JSON.stringify({ query }), cache: "no-store" });
    const text = await res.text();
    if (!res.ok) return `HTTP ${res.status}: ${text.slice(0, 300)}`;
    const json = JSON.parse(text);
    if (json.errors) return `Fehler: ${json.errors[0]?.message}`;
    const t = json.data?.__type;
    if (!t) return "Typ nicht vorhanden";
    return (t.fields ?? []).map((f: any) => `${f.name}: ${typeName(f.type)}`).join("\n") || "(keine Felder)";
  } catch (e) {
    return `Abruf fehlgeschlagen: ${(e as Error).message}`;
  }
}

export default async function Diagnose({ searchParams }: { searchParams: { t?: string } }) {
  const names = (searchParams.t ? searchParams.t.split(",") : TYPES)
    .map((n) => n.trim())
    .filter((n) => /^[A-Za-z0-9_]+$/.test(n));
  const results: [string, string][] = [];
  for (const n of names) results.push([n, await inspect(n)]);
  return (
    <main>
      <h1>Diagnose</h1>
      <p>Technische Übersicht der Sorare-Schnittstelle. Wird später wieder entfernt.</p>
      {results.map(([n, r]) => (
        <section key={n}>
          <h2>{n}</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{r}</pre>
        </section>
      ))}
    </main>
  );
}
