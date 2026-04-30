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

describe("PUT /dentists/:id", () => {
  it("atualiza name, phone e email e retorna 200", async () => {
    const user = await createTestUser({
      email: testEmail("dent-upd"),
      password: "p",
    });
    const dentist = await createTestDentist({
      name: testDentistName("orig"),
      phone: "(11) 1111-1111",
      email: "old@example.com",
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const newName = testDentistName("renamed");
    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}`,
      headers,
      payload: {
        name: newName,
        phone: "(11) 99999-7777",
        email: "new@example.com",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: dentist.id,
      name: newName,
      phone: "(11) 99999-7777",
      email: "new@example.com",
    });

    await app.close();
  });

  it("reativa dentista inativo via active=true", async () => {
    const user = await createTestUser({
      email: testEmail("dent-upd"),
      password: "p",
    });
    const dentist = await createTestDentist({
      name: testDentistName("off"),
      active: false,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}`,
      headers,
      payload: { active: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().active).toBe(true);

    await app.close();
  });

  it("retorna 404 para id inexistente", async () => {
    const user = await createTestUser({
      email: testEmail("dent-upd"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${randomUUID()}`,
      headers,
      payload: { name: testDentistName("ghost") },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("retorna 400 com email mal formado", async () => {
    const user = await createTestUser({
      email: testEmail("dent-upd"),
      password: "p",
    });
    const dentist = await createTestDentist({
      name: testDentistName("bad-email"),
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}`,
      headers,
      payload: { email: "not-an-email" },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${randomUUID()}`,
      payload: { name: testDentistName("noauth") },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
