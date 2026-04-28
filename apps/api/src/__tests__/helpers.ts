import { PrismaClient } from "@prisma/client";
import { buildApp } from "@/app.js";
import { createInMemoryTokenStore, type TokenStore } from "@/lib/tokenStore.js";
import { hashPassword } from "@/lib/password.js";

let sharedPrisma: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!sharedPrisma) sharedPrisma = new PrismaClient();
  return sharedPrisma;
}

export async function buildTestApp(opts: { tokenStore?: TokenStore } = {}) {
  const tokenStore = opts.tokenStore ?? createInMemoryTokenStore();
  const app = await buildApp({ tokenStore, prisma: getTestPrisma() });
  return { app, tokenStore };
}

export function testEmail(tag: string): string {
  return `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
}

export async function createTestUser(params: {
  email: string;
  password: string;
  name?: string;
}) {
  const prisma = getTestPrisma();
  const passwordHash = await hashPassword(params.password);
  return prisma.user.create({
    data: {
      email: params.email,
      passwordHash,
      name: params.name ?? "Test User",
    },
  });
}

export async function cleanupTestUsers() {
  const prisma = getTestPrisma();
  await prisma.user.deleteMany({ where: { email: { endsWith: "@test.local" } } });
}
