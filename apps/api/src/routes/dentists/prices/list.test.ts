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
  createTestSpecificPrice,
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

describe("GET /dentists/:dentistId/prices", () => {
  it("retorna uma linha por serviço ativo, sem override usa preço-tabela", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-list"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("d1") });
    const svcA = await createTestService({
      name: testServiceName("a-svc"),
      price: 100,
    });
    const svcB = await createTestService({
      name: testServiceName("b-svc"),
      price: 200,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${dentist.id}/prices`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: Array<Record<string, unknown>> };
    const ours = body.items.filter(
      (i) => i.serviceId === svcA.id || i.serviceId === svcB.id,
    );
    expect(ours).toHaveLength(2);
    const a = ours.find((i) => i.serviceId === svcA.id);
    expect(a).toMatchObject({
      serviceId: svcA.id,
      serviceName: svcA.name,
      tablePrice: 100,
      specificPrice: null,
      effectivePrice: 100,
    });

    await app.close();
  });

  it("usa preço específico como efetivo quando há override", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-list"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("d2") });
    const svc = await createTestService({
      name: testServiceName("svc-with-override"),
      price: 100,
    });
    await createTestSpecificPrice({
      dentistId: dentist.id,
      serviceId: svc.id,
      price: 75.5,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${dentist.id}/prices`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: Array<Record<string, unknown>> };
    const row = body.items.find((i) => i.serviceId === svc.id);
    expect(row).toMatchObject({
      tablePrice: 100,
      specificPrice: 75.5,
      effectivePrice: 75.5,
    });

    await app.close();
  });

  it("não inclui serviço inativo mesmo quando há override", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-list"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("d3") });
    const activeSvc = await createTestService({
      name: testServiceName("active"),
      price: 100,
    });
    const inactiveSvc = await createTestService({
      name: testServiceName("inactive"),
      price: 200,
      active: false,
    });
    await createTestSpecificPrice({
      dentistId: dentist.id,
      serviceId: inactiveSvc.id,
      price: 150,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${dentist.id}/prices`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: Array<Record<string, unknown>> };
    const ids = body.items.map((i) => i.serviceId);
    expect(ids).toContain(activeSvc.id);
    expect(ids).not.toContain(inactiveSvc.id);

    await app.close();
  });

  it("funciona para dentista inativo", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-list"),
      password: "p",
    });
    const dentist = await createTestDentist({
      name: testDentistName("d-off"),
      active: false,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${dentist.id}/prices`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().items)).toBe(true);

    await app.close();
  });

  it("ordena por nome de serviço asc", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-list"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("d-ord") });
    // Names com prefixo z e a para cravar a ordem.
    const svcZ = await createTestService({
      name: `[TEST]-zzz-${Date.now()}`,
      price: 10,
    });
    const svcA = await createTestService({
      name: `[TEST]-aaa-${Date.now()}`,
      price: 20,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${dentist.id}/prices`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: Array<{ serviceId: string }> };
    const ours = body.items.filter(
      (i) => i.serviceId === svcA.id || i.serviceId === svcZ.id,
    );
    expect(ours.map((i) => i.serviceId)).toEqual([svcA.id, svcZ.id]);

    await app.close();
  });

  it("retorna 404 para dentista inexistente", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-list"),
      password: "p",
    });
    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${randomUUID()}/prices`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("dentist_not_found");

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: `/dentists/${randomUUID()}/prices`,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
