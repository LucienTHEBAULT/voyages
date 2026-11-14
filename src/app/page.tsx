"use client";

import { useState } from "react";
import { airports } from "@/lib/airports";
import type { Trip } from "@/lib/types";

function routeOf(trip: Trip): string {
  return [trip.legs[0].flight.from, ...trip.legs.map((l) => l.flight.to)].join(" → ");
}

export default function Home() {
  const [origins, setOrigins] = useState<string[]>(["STR", "BSL"]);
  const [earliestStart, setEarliestStart] = useState("2027-07-01");
  const [latestStart, setLatestStart] = useState("2027-07-05");
  const [stops, setStops] = useState(3);
  const [minNights, setMinNights] = useState(3);
  const [maxNights, setMaxNights] = useState(5);
  const [maxBudget, setMaxBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trips, setTrips] = useState<Trip[] | null>(null);

  function toggleOrigin(code: string) {
    setOrigins((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function search() {
    setLoading(true);
    setError("");
    setTrips(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origins,
          returnAirports: origins,
          earliestStart,
          latestStart,
          stops,
          minNights,
          maxNights,
          maxBudget: maxBudget === "" ? undefined : Number(maxBudget),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur inconnue.");
      else setTrips(data.trips);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  const input = "rounded border border-gray-300 px-2 py-1 w-full";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Voyages au meilleur prix</h1>
      <p className="mt-1 text-gray-600">
        Trouve où partir pour le moins cher, en enchaînant plusieurs pays.
      </p>

      <div className="mt-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
        Démo : les prix affichés sont fictifs, générés pour tester le moteur.
      </div>

      <section className="mt-6 grid gap-4 rounded border border-gray-200 p-4">
        <div>
          <p className="font-medium">Aéroports de départ (et de retour possible)</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {airports.map((a) => (
              <label key={a.code} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={origins.includes(a.code)}
                  onChange={() => toggleOrigin(a.code)}
                />
                {a.city} ({a.code})
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            Départ au plus tôt
            <input type="date" className={input} value={earliestStart}
              min="2027-07-01" max="2027-07-15"
              onChange={(e) => setEarliestStart(e.target.value)} />
          </label>
          <label className="text-sm">
            Départ au plus tard
            <input type="date" className={input} value={latestStart}
              min="2027-07-01" max="2027-07-15"
              onChange={(e) => setLatestStart(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="text-sm">
            Étapes (1 à 3)
            <input type="number" min={1} max={3} className={input} value={stops}
              onChange={(e) => setStops(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Nuits min.
            <input type="number" min={1} max={7} className={input} value={minNights}
              onChange={(e) => setMinNights(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Nuits max.
            <input type="number" min={1} max={7} className={input} value={maxNights}
              onChange={(e) => setMaxNights(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Budget max. (€)
            <input type="number" min={1} className={input} value={maxBudget}
              placeholder="Aucun"
              onChange={(e) => setMaxBudget(e.target.value)} />
          </label>
        </div>

        <button
          onClick={search}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Recherche en cours…" : "Rechercher"}
        </button>
      </section>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {trips && trips.length === 0 && (
        <p className="mt-4 text-gray-600">Aucun circuit trouvé avec ces critères.</p>
      )}

      {trips && trips.length > 0 && (
        <ul className="mt-6 grid gap-3">
          {trips.map((trip) => {
            const first = trip.legs[0].flight.date;
            const last = trip.legs[trip.legs.length - 1].flight.date;
            return (
              <li key={routeOf(trip) + first} className="rounded border border-gray-200 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold">{routeOf(trip)}</span>
                  <span className="text-xl font-bold">{trip.totalPrice} €</span>
                </div>
                <p className="text-sm text-gray-600">
                  Du {first} au {last} · séjours :{" "}
                  {trip.legs.slice(0, -1).map((l) => l.nightsAtDestination).join(", ")} nuits
                </p>
                {trip.warnings.map((w) => (
                  <p key={w} className="mt-1 text-sm text-amber-700">⚠ {w}</p>
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}