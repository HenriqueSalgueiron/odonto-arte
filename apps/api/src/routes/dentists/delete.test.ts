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

describe("DELETE /dentists/:id", () => {
  it("retorna 204 e marca active=false (soft delete)", async () => {
    const user = await createTestUser({
      email: testEmail("dent-del"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("del") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}`,
      headers,
    });

    expect(res.statusCode).toBe(204);

    const after = await getTestPrisma().dentist.findUnique({
      where: { id: dentist.id },
    });
    expect(after).not.toBeNull();
    expect(after!.active).toBe(false);

    await app.close();
  });

  it("retorna 404 para id inexistente", async () => {
    const user = await createTestUser({
      email: testEmail("dent-del"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${randomUUID()}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("é idempotente — segundo DELETE no mesmo id retorna 204", async () => {
    const user = await createTestUser({
      email: testEmail("dent-del"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("idem") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const first = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}`,
      headers,
    });
    expect(first.statusCode).toBe(204);

    const second = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}`,
      headers,
    });
    expect(second.statusCode).toBe(204);

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${randomUUID()}`,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
