import { randomUUID } from "node:crypto";
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

describe("GET /dentists/:id", () => {
  it("retorna 200 com o dentista pelo id", async () => {
    const user = await createTestUser({
      email: testEmail("dent-get"),
      password: "p",
    });
    const dentist = await createTestDentist({
      name: testDentistName("get"),
      cro: "CRO-RJ 999",
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${dentist.id}`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: dentist.id,
      name: dentist.name,
      cro: "CRO-RJ 999",
      active: true,
    });

    await app.close();
  });

  it("retorna 404 para uuid inexistente", async () => {
    const user = await createTestUser({
      email: testEmail("dent-get"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${randomUUID()}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("dentist_not_found");

    await app.close();
  });

  it("retorna 400 para id mal formado", async () => {
    const user = await createTestUser({
      email: testEmail("dent-get"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/dentists/not-a-uuid",
      headers,
    });

    expect(res.statusCode).toBe(400);

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${randomUUID()}`,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
