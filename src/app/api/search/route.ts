import { airports } from "@/lib/airports";
import { generateMockFlights } from "@/lib/mockFlights";
import { findCheapestTrips } from "@/lib/engine";

const knownAirports = new Set(airports.map((a) => a.code));
const flights = generateMockFlights("2027-07-01", 30); // généré une seule fois

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function validCodes(list: unknown): list is string[] {
  return (
    Array.isArray(list) &&
    list.length >= 1 &&
    list.length <= 6 &&
    list.every((c) => typeof c === "string" && knownAirports.has(c))
  );
}

function validInt(n: unknown, min: number, max: number): n is number {
  return Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return bad("Requête invalide.");

  if (!validCodes(body.origins)) return bad("Choisis entre 1 et 6 aéroports.");
  if (!validCodes(body.returnAirports)) return bad("Aéroports de retour invalides.");

  const { earliestStart, latestStart } = body;
  const dateOk = (d: unknown) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!dateOk(earliestStart) || !dateOk(latestStart)) return bad("Dates invalides.");
  if (earliestStart < "2027-07-01" || latestStart > "2027-07-15" || earliestStart > latestStart) {
    return bad("Pour la démo, choisis des départs entre le 1er et le 15 juillet 2027.");
  }

  if (!validInt(body.stops, 1, 3)) return bad("Le nombre d’étapes doit être de 1 à 3.");
  if (!validInt(body.minNights, 1, 7) || !validInt(body.maxNights, 1, 7) || body.minNights > body.maxNights) {
    return bad("Durée de séjour invalide (1 à 7 nuits, minimum ≤ maximum).");
  }
  if (body.maxBudget !== undefined && !(typeof body.maxBudget === "number" && body.maxBudget > 0)) {
    return bad("Budget invalide.");
  }

  const trips = findCheapestTrips(flights, {
    origins: body.origins,
    returnAirports: body.returnAirports,
    earliestStart,
    latestStart,
    stops: body.stops,
    minNights: body.minNights,
    maxNights: body.maxNights,
    maxBudget: body.maxBudget,
  });

  return Response.json({ trips });
}