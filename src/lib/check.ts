import { generateMockFlights } from "./mockFlights";

const flights = generateMockFlights("2027-07-01", 30);
console.log("Nombre de vols fictifs :", flights.length);
console.log("Premier vol :", flights[0]);