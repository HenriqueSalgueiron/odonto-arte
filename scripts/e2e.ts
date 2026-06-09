import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Client } from "pg";

function loadDotEnv(path: string): Record<string, string> {
  try {
    const content = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

const apiEnv = loadDotEnv("apps/api/.env");
const rawBase =
  process.env.DATABASE_URL ??
  apiEnv.DATABASE_URL ??
  "postgresql://odontoarte:dev123@localhost:5432/odontoarte_dev";

const adminUrl = new URL(rawBase);
adminUrl.searchParams.delete("schema");

const e2eUrl = new URL(rawBase);
e2eUrl.searchParams.set("schema", "e2e");

// Mescla apiEnv (vars do .env) + process.env (vars do shell) + override DATABASE_URL.
// process.env tem precedência sobre apiEnv pra preservar overrides do shell.
const childEnv = {
  ...apiEnv,
  ...process.env,
  DATABASE_URL: e2eUrl.toString(),
};

async function resetSchema(): Promise<void> {
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS e2e CASCADE");
    await client.query("CREATE SCHEMA e2e");
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  console.log("[e2e] Recriando schema e2e...");
  await resetSchema();

  console.log("[e2e] Rodando migrations no schema e2e...");
  execSync("pnpm --filter @odontoarte/api db:deploy", {
    stdio: "inherit",
    env: childEnv,
  });

  console.log("[e2e] Semeando usuário admin + lab info...");
  execSync("pnpm --filter @odontoarte/api db:seed", {
    stdio: "inherit",
    env: childEnv,
  });

  const interactive = process.argv.includes("--open");
  const cypressCmd = interactive ? "cypress open" : "cypress run";

  console.log(`[e2e] Subindo servidores e ${cypressCmd}...`);
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "start-server-and-test",
      "pnpm dev",
      "http://localhost:3000|http-get://localhost:3001/health",
      `pnpm --filter @odontoarte/web exec ${cypressCmd}`,
    ],
    { stdio: "inherit", env: childEnv },
  );

  process.exit(result.status ?? 0);
}

main().catch((err) => {
  console.error("[e2e] Erro:", err);
  process.exit(1);
});
