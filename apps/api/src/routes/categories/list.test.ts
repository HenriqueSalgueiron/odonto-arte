import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestCategories,
  cleanupTestServices,
  cleanupTestUsers,
  createTestCategory,
  createTestService,
  createTestUser,
  getTestPrisma,
  testCategoryName,
  testEmail,
  testServiceName,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestServices();
  await cleanupTestCategories();
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("GET /categories", () => {
  it("lista categorias ordenadas por nome com serviceCount", async () => {
    const user = await createTestUser({
      email: testEmail("cat-list"),
      password: "p",
    });

    const zeta = await createTestCategory({ name: testCategoryName("zeta") });
    const alpha = await createTestCategory({ name: testCategoryName("alpha") });

    await createTestService({
      name: testServiceName("svc-a"),
      categoryId: alpha.id,
    });
    await createTestService({
      name: testServiceName("svc-b"),
      categoryId: alpha.id,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({ method: "GET", url: "/categories", headers });

    expect(res.statusCode).toBe(200);
    const items = res.json().items as Array<{
      id: string;
      name: string;
      serviceCount: number;
    }>;
    const test = items.filter((c) => c.name.startsWith("[TEST]-"));
    expect(test).toHaveLength(2);
    expect(test[0].name < test[1].name).toBe(true);
    const alphaItem = test.find((c) => c.id === alpha.id)!;
    const zetaItem = test.find((c) => c.id === zeta.id)!;
    expect(alphaItem.serviceCount).toBe(2);
    expect(zetaItem.serviceCount).toBe(0);

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: "GET", url: "/categories" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
