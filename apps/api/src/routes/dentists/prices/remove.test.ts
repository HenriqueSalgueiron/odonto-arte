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

describe("DELETE /dentists/:dentistId/prices/:serviceId", () => {
  it("remove override existente e retorna 204", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-rm"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("dr1") });
    const svc = await createTestService({
      name: testServiceName("rsvc1"),
      price: 100,
    });
    await createTestSpecificPrice({
      dentistId: dentist.id,
      serviceId: svc.id,
      price: 75,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
    });

    expect(res.statusCode).toBe(204);

    const after = await getTestPrisma().specificPrice.count({
      where: { dentistId: dentist.id, serviceId: svc.id },
    });
    expect(after).toBe(0);

    await app.close();
  });

  it("é idempotente — segundo DELETE também retorna 204", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-rm"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("dr2") });
    const svc = await createTestService({
      name: testServiceName("rsvc2"),
      price: 100,
    });
    await createTestSpecificPrice({
      dentistId: dentist.id,
      serviceId: svc.id,
      price: 75,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const first = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
    });
    const second = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
    });

    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(204);

    await app.close();
  });

  it("retorna 204 quando nunca houve override", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-rm"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("dr3") });
    const svc = await createTestService({
      name: testServiceName("rsvc3"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}/prices/${svc.id}`,
      headers,
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it("retorna 404 dentist_not_found quando dentista não existe", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-rm"),
      password: "p",
    });
    const svc = await createTestService({
      name: testServiceName("rsvc4"),
      price: 100,
    });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${randomUUID()}/prices/${svc.id}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("dentist_not_found");

    await app.close();
  });

  it("retorna 404 service_not_found quando serviço não existe", async () => {
    const user = await createTestUser({
      email: testEmail("dprices-rm"),
      password: "p",
    });
    const dentist = await createTestDentist({ name: testDentistName("dr5") });

    const { app } = await buildTestApp();
    const headers = await authHeaderFor(user.id);

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${dentist.id}/prices/${randomUUID()}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("service_not_found");

    await app.close();
  });

  it("retorna 401 sem token", async () => {
    const { app } = await buildTestApp();

    const res = await app.inject({
      method: "DELETE",
      url: `/dentists/${randomUUID()}/prices/${randomUUID()}`,
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
