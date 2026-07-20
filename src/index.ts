import "dotenv/config";

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";

config({ path: ".env.development" });

export * from "./db/schema/appointments";
export * from "./db/schema/clinics";
export * from "./db/schema/doctors";
export * from "./db/schema/patients";
export * from "./db/schema/relations";
export * from "./db/schema/users";
export * from "./db/schema/usersToClinics";

export const db = drizzle(process.env.DATABASE_URL!);
