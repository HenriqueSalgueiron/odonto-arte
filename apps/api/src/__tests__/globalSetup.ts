import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import { PrismaClient } from "@prisma/client";

const exec = promisify(execFile);

const BASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://odontoarte:dev123@localhost:5432/odontoarte_dev";

const N_SCHEMAS = os.cpus().length;
const SCHEMAS = Array.from({ length: N_SCHEMAS }, (_, i) => `test_${i + 1}`);

function urlForSchema(schema: string): string {
  const url = new URL(BASE_URL);
  url.searchParams.set("schema", schema);
  return url.toString();
}

async function withAdmin<T>(fn: (admin: PrismaClient) => Promise<T>): Promise<T> {
  const admin = new PrismaClient({ datasources: { db: { url: BASE_URL } } });
  try {
    return await fn(admin);
  } finally {
    await admin.$disconnect();
  }
}

export async function setup() {
  await withAdmin(async (admin) => {
    for (const schema of SCHEMAS) {
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    }
  });

  await Promise.all(
    SCHEMAS.map((schema) =>
      exec("pnpm", ["prisma", "migrate", "deploy"], {
        env: { ...process.env, DATABASE_URL: urlForSchema(schema) },
      }),
    ),
  );
}

export async function teardown() {
  await withAdmin(async (admin) => {
    for (const schema of SCHEMAS) {
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
  });
}
