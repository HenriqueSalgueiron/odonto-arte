import { randomUUID } from "node:crypto";
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
});
