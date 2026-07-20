import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Força o carregamento do arquivo correto (mude para ".env" se o seu arquivo se chamar apenas .env)
config({ path: ".env.development" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
