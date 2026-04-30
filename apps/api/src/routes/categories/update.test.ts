import { randomUUID } from "node:crypto";
import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestCategories,
  cleanupTestUsers,
  createTestCategory,
  createTestUser,
  getTestPrisma,
  testCategoryName,
  testEmail,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestCategories();
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("PUT /categories/:id", () => {
  it("renomeia e retorna 200", async () => {
    const user = await createTestUser({ email: testEmail("cat-upd"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("orig") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const newName = testCategoryName("renamed");
    const res = await app.inject({
      method: "PUT",
      url: `/categories/${cat.id}`,
      headers,
      payload: { name: newName },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: cat.id, name: newName });

    await app.close();
  });

  it("retorna 404 para id inexistente", async () => {
    const user = await createTestUser({ email: testEmail("cat-upd"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/categories/${randomUUID()}`,
      headers,
      payload: { name: testCategoryName("ghost") },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("category_not_found");

    await app.close();
  });

  it("bloqueia rename para 'Diversos'", async () => {
    const user = await createTestUser({ email: testEmail("cat-upd"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("orig") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/categories/${cat.id}`,
      headers,
      payload: { name: "Diversos" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");

    await app.close();
  });

  it("retorna 409 com nome duplicado", async () => {
    const user = await createTestUser({ email: testEmail("cat-upd"), password: "p" });
    const a = await createTestCategory({ name: testCategoryName("a") });
    const b = await createTestCategory({ name: testCategoryName("b") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/categories/${b.id}`,
      headers,
      payload: { name: a.name },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe("category_name_taken");

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "PUT",
      url: `/categories/${randomUUID()}`,
      payload: { name: testCategoryName("noauth") },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
