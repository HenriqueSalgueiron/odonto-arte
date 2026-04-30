import { randomUUID } from "node:crypto";
import { describe, it, expect, afterAll, afterEach } from "vitest";
import {
  authHeaderFor,
  buildTestApp,
  cleanupTestDentists,
  cleanupTestServices,
  cleanupTestUsers,
  createTestDentist,
  createTestService,
  createTestUser,
  getTestPrisma,
  testDentistName,
  testEmail,
  testServiceName,
} from "@/__tests__/helpers.js";

afterEach(async () => {
  await cleanupTestDentists();
  await cleanupTestServices();
  await cleanupTestUsers();
});

afterAll(async () => {
  await getTestPrisma().$disconnect();
});

describe("PUT /dentists/:dentistId/prices/:serviceId", () => {
  it("cria override quando não existia", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("ds1") });
    const svc = await createTestService({
      name: testServiceName("svc1"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const before = await getTestPrisma().specificPrice.count({
      where: { dentistId: dentist.id, serviceId: svc.id },
    });
    expect(before).toBe(0);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: 275.5 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      dentistId: dentist.id,
      serviceId: svc.id,
      price: 275.5,
    });

    const after = await getTestPrisma().specificPrice.count({
      where: { dentistId: dentist.id, serviceId: svc.id },
    });
    expect(after).toBe(1);

    await app.close();
  });

  it("atualiza override existente preservando id e avançando updatedAt", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("ds2") });
    const svc = await createTestService({
      name: testServiceName("svc2"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const first = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: 200 },
    });
    expect(first.statusCode).toBe(200);
    const firstBody = first.json();

    // Pequeno delay para garantir delta de updatedAt
    await new Promise((r) => setTimeout(r, 10));

    const second = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: 250 },
    });
    expect(second.statusCode).toBe(200);
    const secondBody = second.json();

    expect(secondBody.id).toBe(firstBody.id);
    expect(secondBody.price).toBe(250);
    expect(new Date(secondBody.updatedAt).getTime()).toBeGreaterThan(
      new Date(firstBody.updatedAt).getTime(),
    );

    await app.close();
  });

  it("retorna 400 para preço negativo", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("ds3") });
    const svc = await createTestService({
      name: testServiceName("svc3"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: -1 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 400 para preço com mais de 2 casas decimais", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("ds4") });
    const svc = await createTestService({
      name: testServiceName("svc4"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: 250.123 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("retorna 404 dentist_not_found quando dentista não existe", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const svc = await createTestService({
      name: testServiceName("svc5"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${randomUUID()}/prices/${svc.id}`,
      headers,
      payload: { price: 100 },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("dentist_not_found");

    await app.close();
  });

  it("retorna 404 service_not_found quando serviço não existe", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("ds6") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${randomUUID()}`,
      headers,
      payload: { price: 100 },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("service_not_found");

    await app.close();
  });

  it("permite override em serviço inativo", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("ds7") });
    const svc = await createTestService({
      name: testServiceName("svc-off"),
      price: 100,
      active: false,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: 90 },
    });

    expect(res.statusCode).toBe(200);
    const row = await getTestPrisma().specificPrice.findUnique({
      where: { dentistId_serviceId: { dentistId: dentist.id, serviceId: svc.id } },
    });
    expect(row).not.toBeNull();
    expect(Number(row?.price)).toBe(90);

    await app.close();
  });

  it("permite override em dentista inativo", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-set"),
      password: "p",
    });
    const dentist = await createTestDentist({
      name: testDentistName("d-off"),
      active: false,
    });
    const svc = await createTestService({
      name: testServiceName("svc8"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
      payload: { price: 90 },
    });

    expect(res.statusCode).toBe(200);
    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "PUT",
      url: `/dentists/${randomUUID()}/prices/${randomUUID()}`,
      payload: { price: 100 },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
