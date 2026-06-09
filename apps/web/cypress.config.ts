import { defineConfig } from "cypress";
import { Client } from "pg";

// "users" intencionalmente fora: o admin é seedado uma vez pelo orchestrator
// e persiste entre testes. cy.login() usa as credenciais do seed.
const TRUNCATABLE_TABLES = [
  "service_order_items",
  "order_attachments",
  "service_orders",
  "specific_prices",
  "services",
  "dentists",
  "categories",
  "lab_info",
  "export_template",
] as const;

async function resetDb(): Promise<null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL not set when running Cypress tasks");
  }

  const url = new URL(dbUrl);
  const schema = url.searchParams.get("schema") ?? "public";
  url.searchParams.delete("schema");

  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(
      `TRUNCATE TABLE ${TRUNCATABLE_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await client.end();
  }
  return null;
}

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      config.env.adminEmail =
        process.env.SEED_USER_EMAIL ?? "admin@odontoarte.local";
      config.env.adminPassword =
        process.env.SEED_USER_PASSWORD ?? "changeme";
      config.env.apiUrl = process.env.VITE_API_URL ?? "http://localhost:3001";

      on("task", {
        "db:reset": resetDb,
      });

      return config;
    },
  },
});
