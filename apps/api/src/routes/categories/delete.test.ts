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

describe("DELETE /categories/:id", () => {
  it("remove a categoria e desassocia serviços (categoryId vira null)", async () => {
    const user = await createTestUser({ email: testEmail("cat-del"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("del") });
    const svc = await createTestService({
      name: testServiceName("attached"),
      categoryId: cat.id,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/categories/${cat.id}`,
      headers,
    });

    expect(res.statusCode).toBe(204);

    const stillThere = await getTestPrisma().category.findUnique({
      where: { id: cat.id },
    });
    expect(stillThere).toBeNull();

    const updatedService = await getTestPrisma().service.findUnique({
      where: { id: svc.id },
    });
    expect(updatedService?.categoryId).toBeNull();

    await app.close();
  });

  it("retorna 404 para id inexistente", async () => {
    const user = await createTestUser({ email: testEmail("cat-del"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
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
      method: "DELETE",
      url: `/categories/${randomUUID()}`,
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
