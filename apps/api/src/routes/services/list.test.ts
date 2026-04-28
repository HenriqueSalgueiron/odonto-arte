import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestServices,
  cleanupTestUsers,
  createTestService,
  createTestUser,
  getTestPrisma,
  testEmail,
  testServiceName,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestServices();
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("GET /services", () => {
  it("retorna apenas serviços ativos por padrão, ordenados por nome", async () => {
    const user = await createTestUser({ email: testEmail("svc-list"), password: "p" });
    await createTestService({ name: testServiceName("zeta-active"), active: true });
    await createTestService({ name: testServiceName("alpha-active"), active: true });
    await createTestService({ name: testServiceName("inactive"), active: false });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({ method: "GET", url: "/services", headers });

    expect(res.statusCode).toBe(200);
    const items = res.json().items as Array<{ name: string; active: boolean }>;
    const testItems = items.filter((s) => s.name.startsWith("[TEST]-"));
    expect(testItems).toHaveLength(2);
    expect(testItems.every((s) => s.active)).toBe(true);
    expect(testItems[0].name < testItems[1].name).toBe(true);

    await app.close();
  });

  it("inclui inativos quando ?includeInactive=true", async () => {
    const user = await createTestUser({ email: testEmail("svc-list"), password: "p" });
    await createTestService({ name: testServiceName("on"), active: true });
    await createTestService({ name: testServiceName("off"), active: false });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/services?includeInactive=true",
      headers,
    });

    expect(res.statusCode).toBe(200);
    const items = res.json().items as Array<{ name: string; active: boolean }>;
    const testItems = items.filter((s) => s.name.startsWith("[TEST]-"));
    expect(testItems).toHaveLength(2);

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({ method: "GET", url: "/services" });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
