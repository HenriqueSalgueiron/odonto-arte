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

describe("GET /services/:id", () => {
  it("retorna 200 com o serviço pelo id", async () => {
    const user = await createTestUser({ email: testEmail("svc-get"), password: "p" });
    const service = await createTestService({
      name: testServiceName("get"),
      price: 320,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/services/${service.id}`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: service.id,
      name: service.name,
      price: 320,
      active: true,
    });

    await app.close();
  });

  it("retorna 404 para uuid inexistente", async () => {
    const user = await createTestUser({ email: testEmail("svc-get"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/services/${randomUUID()}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("service_not_found");

    await app.close();
  });

  it("retorna 400 para id mal formado", async () => {
    const user = await createTestUser({ email: testEmail("svc-get"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/services/not-a-uuid",
      headers,
    });

    expect(res.statusCode).toBe(400);

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: `/services/${randomUUID()}`,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("expande category quando o serviço tem categoria", async () => {
    const user = await createTestUser({ email: testEmail("svc-get"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("expand") });
    const service = await createTestService({
      name: testServiceName("with-cat"),
      categoryId: cat.id,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/services/${service.id}`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().category).toEqual({ id: cat.id, name: cat.name });

    await app.close();
  });

  it("retorna category null quando o serviço não tem categoria", async () => {
    const user = await createTestUser({ email: testEmail("svc-get"), password: "p" });
    const service = await createTestService({ name: testServiceName("no-cat") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/services/${service.id}`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().category).toBeNull();

    await app.close();
  });
});
