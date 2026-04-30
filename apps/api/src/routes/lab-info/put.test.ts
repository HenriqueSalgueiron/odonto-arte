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

const VALID_BODY = {
  responsibleTechnician: "Maria Salgueiro",
  responsibleTechnicianCro: "CRO-RJ 123",
  phone: "21999998888",
  email: "lab@odontoarte.local",
};

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

describe("PUT /lab-info", () => {
  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "PUT",
      url: "/lab-info/",
      payload: VALID_BODY,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("atualiza a linha singleton e a GET reflete os valores novos", async () => {
    await getTestPrisma().labInfo.create({ data: { name: "OdontoArte" } });

    const user = await createTestUser({
      email: testEmail("lab-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const putRes = await app.inject({
      method: "PUT",
      url: "/lab-info/",
      headers,
      payload: VALID_BODY,
    });

    expect(putRes.statusCode).toBe(200);
    expect(putRes.json()).toMatchObject({
      name: "OdontoArte",
      ...VALID_BODY,
    });

    const getRes = await app.inject({
      method: "GET",
      url: "/lab-info/",
      headers,
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()).toMatchObject(VALID_BODY);

    const rows = await getTestPrisma().labInfo.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });

  it("cria a linha quando ainda não existe", async () => {
    const user = await createTestUser({
      email: testEmail("lab-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/lab-info/",
      headers,
      payload: VALID_BODY,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ name: "OdontoArte", ...VALID_BODY });

    const rows = await getTestPrisma().labInfo.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });

  it("retorna 400 quando falta um campo obrigatório", async () => {
    const user = await createTestUser({
      email: testEmail("lab-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const { phone, ...incomplete } = VALID_BODY;
    void phone;

    const res = await app.inject({
      method: "PUT",
      url: "/lab-info/",
      headers,
      payload: incomplete,
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");

    await app.close();
  });

  it("retorna 400 quando email é inválido", async () => {
    const user = await createTestUser({
      email: testEmail("lab-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/lab-info/",
      headers,
      payload: { ...VALID_BODY, email: "not-an-email" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");

    await app.close();
  });

  it("retorna 400 quando responsibleTechnician é apenas espaços", async () => {
    const user = await createTestUser({
      email: testEmail("lab-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/lab-info/",
      headers,
      payload: { ...VALID_BODY, responsibleTechnician: "   " },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");

    await app.close();
  });
});
