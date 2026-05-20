import { describe, it, expect, afterAll, afterEach, beforeEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestUsers,
  createTestUser,
  getTestPrisma,
  resetExportTemplate,
  testEmail,
} from "@/__tests__/helpers.js";

beforeEach(async () => {
  await resetExportTemplate();
});

afterEach(async () => {
  await cleanupTestUsers();
  await resetExportTemplate();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("GET /export-template", () => {
  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({ method: "GET", url: "/export-template/" });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("cria a linha singleton on-demand quando não existe", async () => {
    const user = await createTestUser({
      email: testEmail("export-tpl-get"),
      password: "p",
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/export-template/",
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      categoryOrder: [],
      observations: [],
    });
    expect(typeof body.id).toBe("string");
    expect(typeof body.updatedAt).toBe("string");

    const rows = await getTestPrisma().exportTemplate.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });

  it("retorna a linha existente sem criar nova", async () => {
    await getTestPrisma().exportTemplate.create({
      data: {
        categoryOrder: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
        observations: ["Dentes cobrados a parte."],
      },
    });

    const user = await createTestUser({
      email: testEmail("export-tpl-get"),
      password: "p",
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: "/export-template/",
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      categoryOrder: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      observations: ["Dentes cobrados a parte."],
    });

    const rows = await getTestPrisma().exportTemplate.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });
});
