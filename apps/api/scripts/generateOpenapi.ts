import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV ??= "development";
process.env.DATABASE_URL ??= "postgresql://placeholder:placeholder@localhost:5432/placeholder";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.JWT_SECRET ??= "openapi-placeholder-secret-must-be-32-chars-xx";
process.env.UPSTASH_REDIS_REST_URL ??= "http://localhost:6379";
process.env.UPSTASH_REDIS_REST_TOKEN ??= "placeholder";

const { buildApp } = await import("../src/app.js");
const { createInMemoryTokenStore } = await import("../src/lib/tokenStore.js");

const app = await buildApp({ tokenStore: createInMemoryTokenStore() });
await app.ready();

const spec = app.swagger();

const here = fileURLToPath(new URL(".", import.meta.url));
const outPath = resolve(here, "..", "openapi.json");
await writeFile(outPath, JSON.stringify(spec, null, 2) + "\n", "utf8");

await app.close();

console.log(`OpenAPI spec written to ${outPath}`);
