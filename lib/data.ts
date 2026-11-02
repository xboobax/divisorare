import { demoPlayers } from "./demo";
import { fetchNextFootballFixture, FixtureInfo } from "./sorare";
import { Sport } from "./model";

export async function getData(sport: Sport) {
  let fixture: FixtureInfo | null = null;
  let liveStatus = "Demo-Daten (Live-Spielerdaten noch nicht angebunden)";
  if (sport === "football") {
    try {
      fixture = await fetchNextFootballFixture();
      if (fixture) liveStatus = "Gameweek live von Sorare, Spielerdaten sind Demo";
    } catch (e) {
      liveStatus = `Sorare nicht erreichbar (${(e as Error).message}), Demo-Daten`;
    }
  }
  return { players: demoPlayers(sport), fixture, liveStatus };
}
