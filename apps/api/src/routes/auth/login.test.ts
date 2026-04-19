import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  buildTestApp,
  cleanupTestUsers,
  createTestUser,
  getTestPrisma,
  testEmail,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("POST /auth/login", () => {
  it("retorna tokens com credenciais corretas", async () => {
    const email = testEmail("login");
    const password = "senha-forte-123";
    await createTestUser({ email, password });
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.accessToken).toBe("string");
    expect(typeof body.refreshToken).toBe("string");

    await app.close();
  });

  it("retorna 401 para email inexistente", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: testEmail("ghost"), password: "qualquer" },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("retorna 401 para senha errada", async () => {
    const email = testEmail("wrong");
    await createTestUser({ email, password: "senha-correta" });
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "senha-errada" },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("retorna 400 para body inválido", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nao-e-email", password: "" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");
    await app.close();
  });
});
