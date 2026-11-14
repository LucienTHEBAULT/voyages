// Un aéroport
export type Airport = {
  code: string; // code IATA, ex. "STR"
  city: string;
  country: string; // code pays, ex. "FR"
};

// Un vol avec son prix, tel que relevé dans le cache
export type Flight = {
  from: string; // code de l'aéroport de départ
  to: string; // code de l'aéroport d'arrivée
  date: string; // "2027-07-15"
  price: number; // en euros
  airline: string;
  observedAt: string; // date du relevé du prix
  source: "mock" | "cache" | "live"; // d'où vient ce prix
};

// Une étape d'un circuit : un vol suivi d'un séjour
export type Leg = {
  flight: Flight;
  nightsAtDestination: number;
};

// Un circuit complet
export type Trip = {
  legs: Leg[];
  totalPrice: number;
  warnings: string[]; // ex. "billets séparés", "changement d'aéroport"
};