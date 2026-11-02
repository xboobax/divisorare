# Divination Planer (Sorare Football + NBA)

Ein Next.js-Projekt. Es zeigt eine empfohlene Aufstellung, Prognosen und alle Spieler für Football und NBA.

**Stand dieser Version:** Das Dashboard und das Prognosemodell funktionieren mit Beispieldaten.
Der Gameweek-Abruf für Football ist angelegt, aber UNGETESTET. Echte Spielerdaten sind noch nicht angebunden.
Die Divination-Regeln sind Annahmen (config/divination.ts).

## Online stellen (ohne Programmierkenntnisse)
1. Bei github.com ein neues Repository anlegen, "Add file > Upload files", den gesamten Inhalt dieses Ordners hochladen.
2. Bei vercel.com mit GitHub anmelden, "Add New > Project", das Repository wählen, "Deploy" klicken.
3. Fertig. Die Seite aktualisiert sich alle 5 Minuten selbst.

## Später mit API-Key
Bei Vercel unter Settings > Environment Variables `SORARE_API_KEY` eintragen, dann neu deployen.

## Wenn Sorare-Daten nicht erscheinen
Die Seite zeigt oben den Datenstand an. Bei einem Fehler kopiere die Meldung und schick sie mir.
Alle Sorare-Abfragen stehen nur in lib/sorare.ts.
