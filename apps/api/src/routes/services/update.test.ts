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

describe("PUT /services/:id", () => {
  it("atualiza name e price e retorna 200", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const service = await createTestService({
      name: testServiceName("orig"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const newName = testServiceName("renamed");
    const res = await app.inject({
      method: "PUT",
      url: `/services/${service.id}`,
      headers,
      payload: { name: newName, price: 280 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: service.id,
      name: newName,
      price: 280,
    });

    await app.close();
  });

  it("reativa serviço inativo via active=true", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const service = await createTestService({
      name: testServiceName("off"),
      active: false,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/services/${service.id}`,
      headers,
      payload: { active: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().active).toBe(true);

    await app.close();
  });

  it("retorna 404 para id inexistente", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/services/${randomUUID()}`,
      headers,
      payload: { name: testServiceName("ghost") },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("retorna 400 com body inválido", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const service = await createTestService({ name: testServiceName("bad") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/services/${service.id}`,
      headers,
      payload: { price: -50 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "PUT",
      url: `/services/${randomUUID()}`,
      payload: { name: testServiceName("noauth") },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("atribui categoryId e retorna a categoria expandida", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const service = await createTestService({ name: testServiceName("plain") });
    const cat = await createTestCategory({ name: testCategoryName("set") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/services/${service.id}`,
      headers,
      payload: { categoryId: cat.id },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().category).toEqual({ id: cat.id, name: cat.name });

    await app.close();
  });

  it("remove categoryId quando enviado null", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("orig") });
    const service = await createTestService({
      name: testServiceName("attached"),
      categoryId: cat.id,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/services/${service.id}`,
      headers,
      payload: { categoryId: null },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().category).toBeNull();

    await app.close();
  });

  it("retorna 400 quando categoryId não existe", async () => {
    const user = await createTestUser({ email: testEmail("svc-upd"), password: "p" });
    const service = await createTestService({ name: testServiceName("bad-cat") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/services/${service.id}`,
      headers,
      payload: { categoryId: randomUUID() },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("category_not_found");

    await app.close();
  });
});
