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

const UUID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const UUID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const VALID_BODY = {
  categoryOrder: [UUID_A, UUID_B],
  observations: ["Dentes cobrados a parte.", "Taxa de emergência aplica."],
};

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

describe("PUT /export-template", () => {
  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "PUT",
      url: "/export-template/",
      payload: VALID_BODY,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("cria a linha quando ainda não existe e GET retorna o salvo", async () => {
    const user = await createTestUser({
      email: testEmail("export-tpl-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const putRes = await app.inject({
      method: "PUT",
      url: "/export-template/",
      headers,
      payload: VALID_BODY,
    });

    expect(putRes.statusCode).toBe(200);
    expect(putRes.json()).toMatchObject(VALID_BODY);

    const getRes = await app.inject({
      method: "GET",
      url: "/export-template/",
      headers,
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json()).toMatchObject(VALID_BODY);

    const rows = await getTestPrisma().exportTemplate.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });

  it("atualiza a linha singleton quando já existe", async () => {
    await getTestPrisma().exportTemplate.create({ data: {} });

    const user = await createTestUser({
      email: testEmail("export-tpl-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/export-template/",
      headers,
      payload: VALID_BODY,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject(VALID_BODY);

    const rows = await getTestPrisma().exportTemplate.findMany();
    expect(rows).toHaveLength(1);

    await app.close();
  });

  it("trima e descarta observações vazias ou só-whitespace", async () => {
    const user = await createTestUser({
      email: testEmail("export-tpl-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/export-template/",
      headers,
      payload: {
        categoryOrder: [],
        observations: ["  obs com espaços  ", "", "   ", "outra"],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().observations).toEqual(["obs com espaços", "outra"]);

    await app.close();
  });

  it("aceita categoryOrder com UUID inexistente (não é FK)", async () => {
    const user = await createTestUser({
      email: testEmail("export-tpl-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/export-template/",
      headers,
      payload: {
        categoryOrder: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
        observations: [],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().categoryOrder).toEqual([
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ]);

    await app.close();
  });

  it("retorna 400 quando categoryOrder contém string não-UUID", async () => {
    const user = await createTestUser({
      email: testEmail("export-tpl-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/export-template/",
      headers,
      payload: {
        categoryOrder: ["not-a-uuid"],
        observations: [],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");

    await app.close();
  });

  it("aceita arrays vazios em ambos os campos", async () => {
    const user = await createTestUser({
      email: testEmail("export-tpl-put"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: "/export-template/",
      headers,
      payload: { categoryOrder: [], observations: [] },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      categoryOrder: [],
      observations: [],
    });

    await app.close();
  });
});
