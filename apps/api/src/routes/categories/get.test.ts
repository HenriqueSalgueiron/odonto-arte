import { randomUUID } from "node:crypto";
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

describe("GET /categories/:id", () => {
  it("retorna 200 com a categoria e serviceCount", async () => {
    const user = await createTestUser({ email: testEmail("cat-get"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("get") });
    await createTestService({
      name: testServiceName("svc"),
      categoryId: cat.id,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/categories/${cat.id}`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: cat.id, name: cat.name, serviceCount: 1 });

    await app.close();
  });

  it("retorna 404 para uuid inexistente", async () => {
    const user = await createTestUser({ email: testEmail("cat-get"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/categories/${randomUUID()}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("category_not_found");

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({
      method: "GET",
      url: `/categories/${randomUUID()}`,
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
