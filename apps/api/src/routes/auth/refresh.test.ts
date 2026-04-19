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

async function loginFor(app: Awaited<ReturnType<typeof buildTestApp>>["app"], email: string, password: string) {
  const res = await app.inject({ method: "POST", url: "/auth/login", payload: { email, password } });
  expect(res.statusCode).toBe(200);
  return res.json() as { accessToken: string; refreshToken: string };
}

describe("POST /auth/refresh", () => {
  it("emite novos tokens e invalida o refresh antigo (rotation)", async () => {
    const email = testEmail("refresh");
    const password = "senha";
    await createTestUser({ email, password });
    const { app } = await buildTestApp();

    const tokens = await loginFor(app, email, password);

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: tokens,
    });

    expect(res.statusCode).toBe(200);
    const next = res.json();
    expect(next.accessToken).not.toBe(tokens.accessToken);
    expect(next.refreshToken).not.toBe(tokens.refreshToken);

    const reuse = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: tokens,
    });
    expect(reuse.statusCode).toBe(401);

    await app.close();
  });

  it("retorna 401 para access token malformado", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { accessToken: "nao-e-jwt", refreshToken: "qualquer" },
    });
    expect(res.statusCode).toBe(401);

    await app.close();
  });

  it("retorna 401 quando refresh não confere com o armazenado", async () => {
    const email = testEmail("refresh-bad");
    const password = "senha";
    await createTestUser({ email, password });
    const { app } = await buildTestApp();

    const tokens = await loginFor(app, email, password);

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { accessToken: tokens.accessToken, refreshToken: "refresh-errado" },
    });
    expect(res.statusCode).toBe(401);

    await app.close();
  });
});
