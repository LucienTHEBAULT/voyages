import { airports } from "./airports";
import type { Flight, Leg, Trip } from "./types";

export type SearchParams = {
  origins: string[]; // aéroports de départ possibles
  returnAirports: string[]; // aéroports de retour possibles
  earliestStart: string; // première date de départ, ex. "2027-07-01"
  latestStart: string; // dernière date de départ
  stops: number; // nombre de destinations (au moins 1)
  minNights: number; // séjour minimal par destination
  maxNights: number; // séjour maximal par destination
  maxBudget?: number; // budget maximal en euros
  topResults?: number; // nombre de circuits renvoyés (5 par défaut)
};

// Garde-fous : le moteur s'arrête seul si la recherche est trop large
const MAX_VISITED = 300_000; // nombre maximal de chemins explorés
const MAX_MILLISECONDS = 3000; // durée maximale de la recherche

// Ajoute des jours à une date "AAAA-MM-JJ"
function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Range les vols dans un index pour les retrouver instantanément
// par "date|départ|arrivée"
function buildIndex(flights: Flight[]): Map<string, Flight> {
  const index = new Map<string, Flight>();
  for (const f of flights) {
    const key = `${f.date}|${f.from}|${f.to}`;
    const existing = index.get(key);
    if (!existing || f.price < existing.price) index.set(key, f);
  }
  return index;
}

const countryOf = new Map(airports.map((a) => [a.code, a.country]));

// Identifie un itinéraire par la suite de ses aéroports
function routeKey(trip: Trip): string {
  return [trip.legs[0].flight.from, ...trip.legs.map((l) => l.flight.to)].join(">");
}

export function findCheapestTrips(
  flights: Flight[],
  params: SearchParams
): Trip[] {
  const index = buildIndex(flights);
  const topN = params.topResults ?? 5;
  const maxBudget = params.maxBudget ?? Infinity;
  const best: Trip[] = [];

  let visited = 0;
  let stopped = false;
  const deadline = Date.now() + MAX_MILLISECONDS;

  // Garde un circuit s'il fait partie des moins chers,
  // avec une seule version (la moins chère) par itinéraire
  function keep(trip: Trip) {
    const key = routeKey(trip);
    const i = best.findIndex((t) => routeKey(t) === key);
    if (i >= 0) {
      if (trip.totalPrice >= best[i].totalPrice) return;
      best.splice(i, 1);
    }
    best.push(trip);
    best.sort((a, b) => a.totalPrice - b.totalPrice);
    if (best.length > topN) best.pop();
  }

  function explore(
    legs: Leg[],
    at: string,
    date: string,
    total: number,
    usedCountries: Set<string>
  ) {
    // Garde-fou : trop d'essais ou trop de temps
    visited++;
    if (visited > MAX_VISITED || (visited % 1024 === 0 && Date.now() > deadline)) {
      stopped = true;
    }
    if (stopped) return;

    // Élagage : on abandonne les chemins déjà trop chers
    if (total >= maxBudget) return;
    if (best.length === topN && total >= best[best.length - 1].totalPrice) {
      return;
    }

    // Toutes les destinations sont faites : il reste le vol retour
    if (legs.length === params.stops) {
      const home = legs[0].flight.from;
      for (const code of params.returnAirports) {
        if (code === at) continue;
        const f = index.get(`${date}|${at}|${code}`);
        if (!f) continue;
        const totalPrice = total + f.price;
        if (totalPrice > maxBudget) continue;

        const warnings = [
          "Billets séparés : chaque vol se réserve séparément",
        ];
        if (code !== home) {
          warnings.push(`Retour par un autre aéroport (${code} au lieu de ${home})`);
        }
        keep({
          legs: [...legs, { flight: f, nightsAtDestination: 0 }],
          totalPrice,
          warnings,
        });
      }
      return;
    }

    // Sinon : on essaie chaque destination, dans un pays encore inédit
    for (const airport of airports) {
      if (airport.code === at || usedCountries.has(airport.country)) continue;
      const f = index.get(`${date}|${at}|${airport.code}`);
      if (!f) continue;

      for (let n = params.minNights; n <= params.maxNights; n++) {
        explore(
          [...legs, { flight: f, nightsAtDestination: n }],
          airport.code,
          addDays(f.date, n),
          total + f.price,
          new Set(usedCountries).add(airport.country)
        );
      }
    }
  }

  // Point de départ : chaque aéroport, chaque date de la plage
  for (const origin of params.origins) {
    for (
      let d = params.earliestStart;
      d <= params.latestStart;
      d = addDays(d, 1)
    ) {
      explore([], origin, d, 0, new Set([countryOf.get(origin) ?? ""]));
      if (stopped) return best;
    }
  }

  return best;
}