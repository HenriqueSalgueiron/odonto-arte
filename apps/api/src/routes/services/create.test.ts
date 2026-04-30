import { randomUUID } from "node:crypto";
import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestCategories,
  cleanupTestServices,
  cleanupTestUsers,
  createTestCategory,
  createTestUser,
  getTestPrisma,
  testCategoryName,
  testEmail,
  testServiceName,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestServices();
  await cleanupTestCategories();
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("POST /services", () => {
  it("cria serviço com body válido e retorna 201", async () => {
    const user = await createTestUser({
      email: testEmail("svc-create"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const name = testServiceName("ppr");
    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers,
      payload: { name, description: "Prótese Parcial Removível", price: 250 },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toMatchObject({
      name,
      description: "Prótese Parcial Removível",
      price: 250,
      active: true,
    });
    expect(typeof body.id).toBe("string");

    const persisted = await getTestPrisma().service.findUnique({
      where: { id: body.id },
    });
    expect(persisted).not.toBeNull();
    expect(Number(persisted!.price)).toBe(250);

    await app.close();
  });

  it("retorna 400 sem name", async () => {
    const user = await createTestUser({ email: testEmail("svc"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers,
      payload: { price: 100 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("validation_error");
    await app.close();
  });

  it("retorna 400 com price negativo", async () => {
    const user = await createTestUser({ email: testEmail("svc"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers,
      payload: { name: testServiceName("neg"), price: -1 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 400 com price com mais de 2 casas decimais", async () => {
    const user = await createTestUser({ email: testEmail("svc"), password: "p" });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers,
      payload: { name: testServiceName("dec"), price: 250.123 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 401 sem header de autenticação", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/services",
      payload: { name: testServiceName("noauth"), price: 100 },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("cria com categoryId e retorna a categoria expandida", async () => {
    const user = await createTestUser({ email: testEmail("svc"), password: "p" });
    const cat = await createTestCategory({ name: testCategoryName("cat") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers,
      payload: { name: testServiceName("with-cat"), price: 100, categoryId: cat.id },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().category).toEqual({ id: cat.id, name: cat.name });

    await app.close();
  });

  it("retorna 400 quando categoryId não existe", async () => {
    const user = await createTestUser({ email: testEmail("svc"), password: "p" });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers,
      payload: {
        name: testServiceName("ghost-cat"),
        price: 100,
        categoryId: randomUUID(),
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("category_not_found");

    await app.close();
  });
});
