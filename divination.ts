// ACHTUNG: Die vollständigen Divination-Regeln waren bei der Erstellung nicht
// offiziell bestätigt. Alles hier sind ANNAHMEN. Bitte mit sorare.com/game_rules abgleichen.
export const DIVINATION = {
  name: "Divination",
  opensAt: "2026-10-30T13:00:00Z", // 14:00 Uhr Paris, laut Berichten
  rulesVerified: false,
  football: {
    // Slot-Codes: GK, DEF, MID, FWD oder FLEX (beliebiger Feldspieler)
    slots: ["GK", "DEF", "MID", "FWD", "FLEX"] as string[],
  },
  nba: {
    slots: ["ANY", "ANY", "ANY", "ANY", "ANY"] as string[],
  },
};
