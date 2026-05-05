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

describe("POST /categories", () => {
  it("cria categoria com body válido e retorna 201", async () => {
    const user = await createTestUser({
      email: testEmail("cat-create"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const name = testCategoryName("proteses");
    const res = await app.inject({
      method: "POST",
      url: "/categories",
      headers,
      payload: { name },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toMatchObject({ name });
    expect(body.serviceCount).toBeUndefined();
    expect(typeof body.id).toBe("string");

    await app.close();
  });

  it("retorna 400 sem name", async () => {
    const user = await createTestUser({ email: testEmail("cat"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/categories",
      headers,
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");

    await app.close();
  });

  it("bloqueia nome 'Diversos' (case-insensitive)", async () => {
    const user = await createTestUser({ email: testEmail("cat"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    for (const reserved of ["Diversos", "diversos", "DIVERSOS", "  Diversos  "]) {
      const res = await app.inject({
        method: "POST",
        url: "/categories",
        headers,
        payload: { name: reserved },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe("validation_error");
    }

    await app.close();
  });

  it("retorna 409 com nome duplicado", async () => {
    const user = await createTestUser({ email: testEmail("cat"), password: "p" });
    const name = testCategoryName("dup");
    await createTestCategory({ name });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/categories",
      headers,
      payload: { name },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe("category_name_taken");

    await app.close();
  });

  it("retorna 401 sem header de autenticação", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/categories",
      payload: { name: testCategoryName("noauth") },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
