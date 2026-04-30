import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestDentists,
  cleanupTestUsers,
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

describe("POST /dentists", () => {
  it("cria dentista com body válido e retorna 201", async () => {
    const user = await createTestUser({
      email: testEmail("dent-create"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const name = testDentistName("souza");
    const res = await app.inject({
      method: "POST",
      url: "/dentists",
      headers,
      payload: {
        name,
        cro: "CRO-SP 12345",
        phone: "(11) 99999-8888",
        email: "souza@example.com",
        notes: "Atende quarta e sexta.",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toMatchObject({
      name,
      cro: "CRO-SP 12345",
      phone: "(11) 99999-8888",
      email: "souza@example.com",
      notes: "Atende quarta e sexta.",
      active: true,
    });
    expect(typeof body.id).toBe("string");

    const persisted = await getTestPrisma().dentist.findUnique({
      where: { id: body.id },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.email).toBe("souza@example.com");

    await app.close();
  });

  it("aceita apenas name e persiste opcionais como null", async () => {
    const user = await createTestUser({
      email: testEmail("dent-create"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const name = testDentistName("min");
    const res = await app.inject({
      method: "POST",
      url: "/dentists",
      headers,
      payload: { name },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toMatchObject({
      name,
      cro: null,
      phone: null,
      email: null,
      notes: null,
      active: true,
    });

    await app.close();
  });

  it("retorna 400 sem name", async () => {
    const user = await createTestUser({
      email: testEmail("dent"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/dentists",
      headers,
      payload: { email: "x@y.com" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");
    await app.close();
  });

  it("retorna 400 com email mal formado", async () => {
    const user = await createTestUser({
      email: testEmail("dent"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/dentists",
      headers,
      payload: { name: testDentistName("bad-email"), email: "not-an-email" },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 401 sem header de autenticação", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/dentists",
      payload: { name: testDentistName("noauth") },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
