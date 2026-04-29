const BASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://odontoarte:dev123@localhost:5432/odontoarte_dev";

const poolId = process.env.VITEST_POOL_ID ?? "1";
const schemaUrl = new URL(BASE_URL);
schemaUrl.searchParams.set("schema", `test_${poolId}`);

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = schemaUrl.toString();
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.JWT_SECRET ??= "test-secret-must-be-at-least-32-chars-long-xx";
process.env.JWT_ACCESS_TTL_SECONDS ??= "900";
process.env.REFRESH_TTL_SECONDS ??= "2592000";
process.env.UPSTASH_REDIS_REST_URL ??= "http://localhost:6379";
process.env.UPSTASH_REDIS_REST_TOKEN ??= "test-token";
