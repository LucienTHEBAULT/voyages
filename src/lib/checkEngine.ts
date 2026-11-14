import { generateMockFlights } from "./mockFlights";
import { findCheapestTrips } from "./engine";

const flights = generateMockFlights("2027-07-01", 30);

const start = Date.now();
const trips = findCheapestTrips(flights, {
  origins: ["STR", "BSL"],
  returnAirports: ["STR", "BSL", "FRA", "ZRH"],
  earliestStart: "2027-07-01",
  latestStart: "2027-07-05",
  stops: 3,
  minNights: 3,
  maxNights: 5,
});
console.log(`Recherche terminée en ${Date.now() - start} ms`);

for (const trip of trips) {
  const route = [
    trip.legs[0].flight.from,
    ...trip.legs.map((l) => l.flight.to),
  ].join(" → ");
  const first = trip.legs[0].flight.date;
  const last = trip.legs[trip.legs.length - 1].flight.date;
  console.log(`${trip.totalPrice} € | ${route} | ${first} → ${last}`);
  if (trip.warnings.length) console.log("   ⚠ " + trip.warnings.join(" ; "));
}