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
});
