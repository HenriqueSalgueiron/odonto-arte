import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestDentists,
  cleanupTestUsers,
  createTestDentist,
  createTestUser,
  getTestPrisma,
  testDentistName,
  testEmail,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestDentists();
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("GET /dentists", () => {
  it("retorna apenas dentistas ativos por padrão, ordenados por nome", async () => {
    const user = await createTestUser({
      email: testEmail("dent-list"),
      password: "p",
    });
    await createTestDentist({
      name: testDentistName("zeta-active"),
      active: true,
    });
    await createTestDentist({
      name: testDentistName("alpha-active"),
      active: true,
    });
    await createTestDentist({
      name: testDentistName("inactive"),
      active: false,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({ method: "GET", url: "/dentists", headers });

    expect(res.statusCode).toBe(200);
    const items = res.json().items as Array<{ name: string; active: boolean }>;
    const testItems = items.filter((d) => d.name.startsWith("[TEST]-"));
    expect(testItems).toHaveLength(2);
    expect(testItems.every((d) => d.active)).toBe(true);
    expect(testItems[0].name < testItems[1].name).toBe(true);

    await app.close();
  });

  it("inclui inativos quando ?includeInactive=true", async () => {
    const user = await createTestUser({
      email: testEmail("dent-list"),
      password: "p",
    });
    await createTestDentist({ name: testDentistName("on"), active: true });
    await createTestDentist({ name: testDentistName("off"), active: false });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/dentists?includeInactive=true",
      headers,
    });

    expect(res.statusCode).toBe(200);
    const items = res.json().items as Array<{ name: string; active: boolean }>;
    const testItems = items.filter((d) => d.name.startsWith("[TEST]-"));
    expect(testItems).toHaveLength(2);

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({ method: "GET", url: "/dentists" });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
