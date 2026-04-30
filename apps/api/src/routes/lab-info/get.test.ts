import { describe, it, expect, afterAll, afterEach, beforeEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestUsers,
  createTestUser,
  getTestPrisma,
  resetLabInfo,
  testEmail,
} from "@/__tests__/helpers.js";

beforeEach(async () => {
  await resetLabInfo();
});

afterEach(async () => {
  await cleanupTestUsers();
  await resetLabInfo();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("GET /lab-info", () => {
  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({ method: "GET", url: "/lab-info/" });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("cria a linha singleton on-demand quando não existe", async () => {
    const user = await createTestUser({
      email: testEmail("lab-get"),
      password: "p",
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/lab-info/",
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      name: "OdontoArte",
      responsibleTechnician: null,
      responsibleTechnicianCro: null,
      phone: null,
      email: null,
    });
    expect(typeof body.id).toBe("string");
    expect(typeof body.updatedAt).toBe("string");

    const rows = await getTestPrisma().labInfo.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });

  it("retorna a linha existente sem criar nova", async () => {
    await getTestPrisma().labInfo.create({
      data: {
        name: "OdontoArte",
        responsibleTechnician: "Maria",
        responsibleTechnicianCro: "CRO-RJ 123",
        phone: "21999998888",
        email: "lab@odontoarte.local",
      },
    });

    const user = await createTestUser({
      email: testEmail("lab-get"),
      password: "p",
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/lab-info/",
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      name: "OdontoArte",
      responsibleTechnician: "Maria",
      responsibleTechnicianCro: "CRO-RJ 123",
      phone: "21999998888",
      email: "lab@odontoarte.local",
    });

    const rows = await getTestPrisma().labInfo.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });
});
