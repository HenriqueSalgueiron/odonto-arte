import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  buildTestApp,
  cleanupTestUsers,
  createTestUser,
  getTestPrisma,
  testEmail,
} from "@/__tests__/helpers.js";
import { signAccessToken } from "@/lib/tokens.js";

afterEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("GET /auth/me", () => {
  it("retorna dados do usuário autenticado", async () => {
    const email = testEmail("me");
    const password = "senha";
    const user = await createTestUser({ email, password, name: "Ana" });
    const { app } = await buildTestApp();

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password },
    });
    const { accessToken } = login.json();

    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: user.id, email, name: "Ana" });

    await app.close();
  });

  it("retorna 401 sem header Authorization", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);

    await app.close();
  });

  it("retorna 401 com bearer mal formado", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: "Bearer nao-e-jwt" },
    });
    expect(res.statusCode).toBe(401);

    await app.close();
  });

  it("retorna 401 com access token expirado", async () => {
    const { app } = await buildTestApp();

    const expired = await signAccessToken(
      { userId: "qualquer", tokenId: "qualquer" },
      { secret: process.env.JWT_SECRET!, ttlSeconds: -10 },
    );

    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(res.statusCode).toBe(401);

    await app.close();
  });
});
