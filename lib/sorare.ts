// Alle Sorare-Abfragen stehen NUR in dieser Datei. Sie wurden ohne Internetzugang
// geschrieben und sind UNGETESTET. Bei Fehlern: Schema laden unter
// https://api.sorare.com/graphql/schema und die Felder hier anpassen.
const FOOTBALL_URL = "https://api.sorare.com/graphql";

async function gql(url: string, query: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.SORARE_API_KEY) headers["APIKEY"] = process.env.SORARE_API_KEY; // optional
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query }), next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL-Fehler");
  return json.data;
}

export type FixtureInfo = { slug: string; gameWeek?: number; startDate?: string; endDate?: string };

export async function fetchNextFootballFixture(): Promise<FixtureInfo | null> {
  const data = await gql(
    FOOTBALL_URL,
    `{ football { so5 { so5Fixtures(future: true, first: 1) { nodes { slug gameWeek startDate endDate } } } } }`
  );
  return data?.football?.so5?.so5Fixtures?.nodes?.[0] ?? null;
}
