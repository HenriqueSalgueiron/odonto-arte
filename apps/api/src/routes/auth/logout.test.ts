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

describe("POST /auth/logout", () => {
  it("remove a sessão e impede refresh posterior", async () => {
    const email = testEmail("logout");
    const password = "senha";
    await createTestUser({ email, password });
    const { app } = await buildTestApp();

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });
    const tokens = login.json();

    const out = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: tokens,
    });
    expect(out.statusCode).toBe(204);

    const refresh = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: tokens,
    });
    expect(refresh.statusCode).toBe(401);

    await app.close();
  });

  it("é idempotente — um segundo logout ainda retorna 204", async () => {
    const email = testEmail("logout-idem");
    const password = "senha";
    await createTestUser({ email, password });
    const { app } = await buildTestApp();

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });
    const tokens = login.json();

    await app.inject({ method: "POST", url: "/auth/logout", payload: tokens });
    const again = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: tokens,
    });
    expect(again.statusCode).toBe(204);

    await app.close();
  });

  it("não derruba com access token malformado (idempotente)", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { accessToken: "lixo", refreshToken: "lixo" },
    });
    expect(res.statusCode).toBe(204);

    await app.close();
  });
});
