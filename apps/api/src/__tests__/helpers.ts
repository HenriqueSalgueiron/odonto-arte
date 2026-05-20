import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "@/app.js";
import { createInMemoryTokenStore, type TokenStore } from "@/lib/tokenStore.js";
import { hashPassword } from "@/lib/password.js";
import { signAccessToken } from "@/lib/tokens.js";
import { getEnv } from "@/config/env.js";

let sharedPrisma: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!sharedPrisma) sharedPrisma = new PrismaClient();
  return sharedPrisma;
}

export async function buildTestApp(opts: { tokenStore?: TokenStore } = {}) {
  const tokenStore = opts.tokenStore ?? createInMemoryTokenStore();
  const app = await buildApp({ tokenStore, prisma: getTestPrisma(), logger: false });
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

export function testServiceName(tag: string): string {
  return `[TEST]-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createTestService(data: {
  name: string;
  price?: number;
  active?: boolean;
  description?: string | null;
  categoryId?: string | null;
}) {
  return getTestPrisma().service.create({
    data: {
      price: 100,
      active: true,
      description: null,
      categoryId: null,
      ...data,
    },
  });
}

export async function cleanupTestServices() {
  await getTestPrisma().service.deleteMany({
    where: { name: { startsWith: "[TEST]-" } },
  });
}

export function testDentistName(tag: string): string {
  return `[TEST]-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createTestDentist(data: {
  name: string;
  cro?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active?: boolean;
}) {
  return getTestPrisma().dentist.create({
    data: {
      cro: null,
      phone: null,
      email: null,
      notes: null,
      active: true,
      ...data,
    },
  });
}

export async function cleanupTestDentists() {
  await getTestPrisma().dentist.deleteMany({
    where: { name: { startsWith: "[TEST]-" } },
  });
}

export async function createTestSpecificPrice(data: {
  dentistId: string;
  serviceId: string;
  price: number;
}) {
  return getTestPrisma().specificPrice.create({ data });
}

export function testCategoryName(tag: string): string {
  return `[TEST]-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createTestCategory(data: { name: string }) {
  return getTestPrisma().category.create({ data });
}

export async function cleanupTestCategories() {
  await getTestPrisma().category.deleteMany({
    where: { name: { startsWith: "[TEST]-" } },
  });
}

export async function resetLabInfo() {
  await getTestPrisma().labInfo.deleteMany({});
}

export async function resetExportTemplate() {
  await getTestPrisma().exportTemplate.deleteMany({});
}

export async function authHeaderFor(
  userId: string,
): Promise<{ Authorization: string }> {
  const tokenId = randomUUID();
  const env = getEnv();
  const accessToken = await signAccessToken(
    { userId, tokenId },
    { secret: env.JWT_SECRET, ttlSeconds: env.JWT_ACCESS_TTL_SECONDS },
  );
  return { Authorization: `Bearer ${accessToken}` };
}
