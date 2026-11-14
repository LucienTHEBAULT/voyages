import { airports } from "./airports";
import type { Flight } from "./types";

// Prix de base fictif mais stable pour une paire d'aéroports.
// On additionne les codes des lettres : le résultat est toujours le même.
function basePrice(from: string, to: string): number {
  let sum = 0;
  for (const ch of from + to) sum += ch.charCodeAt(0);
  return 25 + (sum % 90); // entre 25 et 114 €
}

// Génère un vol par jour et par paire d'aéroports
export function generateMockFlights(startDate: string, days: number): Flight[] {
  const flights: Flight[] = [];
  const start = new Date(startDate);

  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + d);
    const date = day.toISOString().slice(0, 10);

    for (const a of airports) {
      for (const b of airports) {
        if (a.code === b.code) continue;
        const variation = (d * 7 + a.code.charCodeAt(0)) % 25;
        flights.push({
          from: a.code,
          to: b.code,
          date,
          price: basePrice(a.code, b.code) + variation,
          airline: "Compagnie fictive",
          observedAt: "2026-11-14",
          source: "mock",
        });
      }
    }
  }
  return flights;
}