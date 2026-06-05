import { http, HttpResponse } from "msw";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const FAKE_TOKENS = {
  accessToken: "access.token.fake",
  refreshToken: "refresh-token-fake",
};

export const FAKE_USER = {
  id: "user-1",
  email: "ana@odontoarte.test",
  name: "Ana",
};

type FakeServiceCategoryRef = { id: string; name: string };

type FakeService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  category: FakeServiceCategoryRef | null;
  createdAt: string;
  updatedAt: string;
};

type FakeCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type FakeDentist = {
  id: string;
  name: string;
  cro: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type FakeSpecificPrice = {
  id: string;
  dentistId: string;
  serviceId: string;
  price: number;
  createdAt: string;
  updatedAt: string;
};

const NOW = new Date("2026-04-28T12:00:00.000Z").toISOString();

export const fakeServicesDb: { items: FakeService[] } = { items: [] };

export function resetFakeServicesDb(items: FakeService[] = []) {
  fakeServicesDb.items = items.map((s) => ({ ...s }));
}

export function makeFakeService(
  overrides: Partial<FakeService> & { name: string },
): FakeService {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name,
    description: overrides.description ?? null,
    price: overrides.price ?? 100,
    active: overrides.active ?? true,
    category: overrides.category ?? null,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export const fakeCategoriesDb: { items: FakeCategory[] } = { items: [] };

export function resetFakeCategoriesDb(items: FakeCategory[] = []) {
  fakeCategoriesDb.items = items.map((c) => ({ ...c }));
}

export function makeFakeCategory(
  overrides: Partial<FakeCategory> & { name: string },
): FakeCategory {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

function countServicesByCategory(categoryId: string): number {
  return fakeServicesDb.items.filter((s) => s.category?.id === categoryId)
    .length;
}

export const fakeDentistsDb: { items: FakeDentist[] } = { items: [] };

export function resetFakeDentistsDb(items: FakeDentist[] = []) {
  fakeDentistsDb.items = items.map((d) => ({ ...d }));
}

export function makeFakeDentist(
  overrides: Partial<FakeDentist> & { name: string },
): FakeDentist {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name,
    cro: overrides.cro ?? null,
    phone: overrides.phone ?? null,
    email: overrides.email ?? null,
    notes: overrides.notes ?? null,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export const fakeSpecificPricesDb: { items: FakeSpecificPrice[] } = { items: [] };

type FakeLabInfo = {
  id: string;
  name: string;
  responsibleTechnician: string | null;
  responsibleTechnicianCro: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: string;
};

export const fakeLabInfoDb: { value: FakeLabInfo | null } = { value: null };

export function makeFakeLabInfo(
  overrides: Partial<FakeLabInfo> = {},
): FakeLabInfo {
  return {
    id: overrides.id ?? "lab-info-singleton",
    name: overrides.name ?? "OdontoArte",
    responsibleTechnician:
      overrides.responsibleTechnician === undefined
        ? null
        : overrides.responsibleTechnician,
    responsibleTechnicianCro:
      overrides.responsibleTechnicianCro === undefined
        ? null
        : overrides.responsibleTechnicianCro,
    phone: overrides.phone === undefined ? null : overrides.phone,
    email: overrides.email === undefined ? null : overrides.email,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export function resetFakeLabInfoDb(value: FakeLabInfo | null = null) {
  fakeLabInfoDb.value = value ? { ...value } : null;
}

type FakeExportTemplate = {
  id: string;
  categoryOrder: string[];
  observations: string[];
  updatedAt: string;
};

export const fakeExportTemplateDb: { value: FakeExportTemplate | null } = {
  value: null,
};

export function makeFakeExportTemplate(
  overrides: Partial<FakeExportTemplate> = {},
): FakeExportTemplate {
  return {
    id: overrides.id ?? "export-template-singleton",
    categoryOrder: overrides.categoryOrder ?? [],
    observations: overrides.observations ?? [],
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export function resetFakeExportTemplateDb(
  value: FakeExportTemplate | null = null,
) {
  fakeExportTemplateDb.value = value
    ? { ...value, categoryOrder: value.categoryOrder.slice(), observations: value.observations.slice() }
    : null;
}

export function resetFakeSpecificPricesDb(items: FakeSpecificPrice[] = []) {
  fakeSpecificPricesDb.items = items.map((p) => ({ ...p }));
}

export function makeFakeSpecificPrice(
  overrides: Partial<FakeSpecificPrice> & {
    dentistId: string;
    serviceId: string;
    price: number;
  },
): FakeSpecificPrice {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    dentistId: overrides.dentistId,
    serviceId: overrides.serviceId,
    price: overrides.price,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export const handlers = [
  http.post(`${API_URL}/auth/login`, async () => HttpResponse.json(FAKE_TOKENS)),
  http.post(`${API_URL}/auth/refresh`, async () =>
    HttpResponse.json({
      accessToken: "access.token.refreshed",
      refreshToken: "refresh-token-refreshed",
    }),
  ),
  http.post(
    `${API_URL}/auth/logout`,
    async () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${API_URL}/auth/me`, async () => HttpResponse.json(FAKE_USER)),

  http.get(`${API_URL}/lab-info/`, () => {
    if (!fakeLabInfoDb.value) {
      fakeLabInfoDb.value = makeFakeLabInfo();
    }
    return HttpResponse.json(fakeLabInfoDb.value);
  }),
  http.get(`${API_URL}/export-template/`, () => {
    if (!fakeExportTemplateDb.value) {
      fakeExportTemplateDb.value = makeFakeExportTemplate();
    }
    return HttpResponse.json(fakeExportTemplateDb.value);
  }),
  http.put(`${API_URL}/export-template/`, async ({ request }) => {
    const body = (await request.json()) as {
      categoryOrder?: string[];
      observations?: string[];
    };
    const current = fakeExportTemplateDb.value ?? makeFakeExportTemplate();
    const observations = (body.observations ?? [])
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    const updated: FakeExportTemplate = {
      ...current,
      categoryOrder: body.categoryOrder ?? current.categoryOrder,
      observations,
      updatedAt: new Date().toISOString(),
    };
    fakeExportTemplateDb.value = updated;
    return HttpResponse.json(updated);
  }),

  http.put(`${API_URL}/lab-info/`, async ({ request }) => {
    const body = (await request.json()) as Partial<FakeLabInfo>;
    const current = fakeLabInfoDb.value ?? makeFakeLabInfo();
    const updated: FakeLabInfo = {
      ...current,
      responsibleTechnician:
        typeof body.responsibleTechnician === "string"
          ? body.responsibleTechnician
          : current.responsibleTechnician,
      responsibleTechnicianCro:
        typeof body.responsibleTechnicianCro === "string"
          ? body.responsibleTechnicianCro
          : current.responsibleTechnicianCro,
      phone: typeof body.phone === "string" ? body.phone : current.phone,
      email: typeof body.email === "string" ? body.email : current.email,
      updatedAt: new Date().toISOString(),
    };
    fakeLabInfoDb.value = updated;
    return HttpResponse.json(updated);
  }),

  http.get(`${API_URL}/services/`, ({ request }) => {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const items = fakeServicesDb.items
      .filter((s) => includeInactive || s.active)
      .sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json({ items });
  }),
  http.get(`${API_URL}/services/:id`, ({ params }) => {
    const found = fakeServicesDb.items.find((s) => s.id === params.id);
    if (!found) {
      return HttpResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),
  http.post(`${API_URL}/services/`, async ({ request }) => {
    const body = (await request.json()) as Partial<FakeService> & {
      categoryId?: string | null;
    };
    let category: FakeServiceCategoryRef | null = null;
    if (body.categoryId) {
      const cat = fakeCategoriesDb.items.find((c) => c.id === body.categoryId);
      if (!cat) {
        return HttpResponse.json(
          { error: "category_not_found" },
          { status: 400 },
        );
      }
      category = { id: cat.id, name: cat.name };
    }
    const created = makeFakeService({
      name: body.name ?? "",
      description: body.description ?? null,
      price: body.price ?? 0,
      category,
    });
    fakeServicesDb.items.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${API_URL}/services/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<FakeService> & {
      categoryId?: string | null;
    };
    const idx = fakeServicesDb.items.findIndex((s) => s.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    const current = fakeServicesDb.items[idx];
    let category = current.category;
    if (body.categoryId !== undefined) {
      if (body.categoryId === null) {
        category = null;
      } else {
        const cat = fakeCategoriesDb.items.find((c) => c.id === body.categoryId);
        if (!cat) {
          return HttpResponse.json(
            { error: "category_not_found" },
            { status: 400 },
          );
        }
        category = { id: cat.id, name: cat.name };
      }
    }
    const { categoryId: _ignore, ...rest } = body;
    void _ignore;
    const updated: FakeService = {
      ...current,
      ...rest,
      category,
      updatedAt: NOW,
    };
    fakeServicesDb.items[idx] = updated;
    return HttpResponse.json(updated);
  }),
  http.delete(`${API_URL}/services/:id`, ({ params }) => {
    const idx = fakeServicesDb.items.findIndex((s) => s.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    fakeServicesDb.items[idx] = {
      ...fakeServicesDb.items[idx],
      active: false,
      updatedAt: NOW,
    };
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/categories/`, () => {
    const items = [...fakeCategoriesDb.items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ ...c, serviceCount: countServicesByCategory(c.id) }));
    return HttpResponse.json({ items });
  }),
  http.post(`${API_URL}/categories/`, async ({ request }) => {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? "";
    if (!name) {
      return HttpResponse.json({ error: "validation_error" }, { status: 400 });
    }
    if (name.toLowerCase() === "diversos") {
      return HttpResponse.json({ error: "validation_error" }, { status: 400 });
    }
    if (
      fakeCategoriesDb.items.some(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return HttpResponse.json(
        { error: "category_name_taken" },
        { status: 409 },
      );
    }
    const created = makeFakeCategory({ name });
    fakeCategoriesDb.items.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${API_URL}/categories/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name?: string };
    const idx = fakeCategoriesDb.items.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "category_not_found" }, { status: 404 });
    }
    const next = { ...fakeCategoriesDb.items[idx] };
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return HttpResponse.json(
          { error: "validation_error" },
          { status: 400 },
        );
      }
      if (name.toLowerCase() === "diversos") {
        return HttpResponse.json(
          { error: "validation_error" },
          { status: 400 },
        );
      }
      if (
        fakeCategoriesDb.items.some(
          (c) => c.id !== next.id && c.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        return HttpResponse.json(
          { error: "category_name_taken" },
          { status: 409 },
        );
      }
      next.name = name;
    }
    next.updatedAt = NOW;
    fakeCategoriesDb.items[idx] = next;
    // Atualiza category.name embarcada nos serviços.
    for (const s of fakeServicesDb.items) {
      if (s.category?.id === next.id) {
        s.category = { id: next.id, name: next.name };
      }
    }
    return HttpResponse.json(next);
  }),
  http.delete(`${API_URL}/categories/:id`, ({ params }) => {
    const idx = fakeCategoriesDb.items.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "category_not_found" }, { status: 404 });
    }
    const removed = fakeCategoriesDb.items[idx];
    fakeCategoriesDb.items.splice(idx, 1);
    for (const s of fakeServicesDb.items) {
      if (s.category?.id === removed.id) {
        s.category = null;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/dentists/:dentistId/prices/`, ({ params }) => {
    const dentistId = params.dentistId as string;
    const dentist = fakeDentistsDb.items.find((d) => d.id === dentistId);
    if (!dentist) {
      return HttpResponse.json({ error: "dentist_not_found" }, { status: 404 });
    }
    const overrideByServiceId = new Map<string, number>();
    for (const o of fakeSpecificPricesDb.items.filter(
      (p) => p.dentistId === dentistId,
    )) {
      overrideByServiceId.set(o.serviceId, o.price);
    }
    const items = fakeServicesDb.items
      .filter((s) => s.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => {
        const tablePrice = s.price;
        const specificPrice = overrideByServiceId.get(s.id) ?? null;
        return {
          serviceId: s.id,
          serviceName: s.name,
          tablePrice,
          specificPrice,
          effectivePrice: specificPrice ?? tablePrice,
        };
      });
    return HttpResponse.json({ items });
  }),
  http.put(
    `${API_URL}/dentists/:dentistId/prices/:serviceId`,
    async ({ params, request }) => {
      const dentistId = params.dentistId as string;
      const serviceId = params.serviceId as string;
      const dentist = fakeDentistsDb.items.find((d) => d.id === dentistId);
      if (!dentist) {
        return HttpResponse.json({ error: "dentist_not_found" }, { status: 404 });
      }
      const service = fakeServicesDb.items.find((s) => s.id === serviceId);
      if (!service) {
        return HttpResponse.json({ error: "service_not_found" }, { status: 404 });
      }
      const body = (await request.json()) as { price: number };
      const idx = fakeSpecificPricesDb.items.findIndex(
        (p) => p.dentistId === dentistId && p.serviceId === serviceId,
      );
      if (idx === -1) {
        const created = makeFakeSpecificPrice({
          dentistId,
          serviceId,
          price: body.price,
        });
        fakeSpecificPricesDb.items.push(created);
        return HttpResponse.json(created);
      }
      const updated = {
        ...fakeSpecificPricesDb.items[idx],
        price: body.price,
        updatedAt: NOW,
      };
      fakeSpecificPricesDb.items[idx] = updated;
      return HttpResponse.json(updated);
    },
  ),
  http.delete(`${API_URL}/dentists/:dentistId/prices/:serviceId`, ({ params }) => {
    const dentistId = params.dentistId as string;
    const serviceId = params.serviceId as string;
    const dentist = fakeDentistsDb.items.find((d) => d.id === dentistId);
    if (!dentist) {
      return HttpResponse.json({ error: "dentist_not_found" }, { status: 404 });
    }
    const service = fakeServicesDb.items.find((s) => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    fakeSpecificPricesDb.items = fakeSpecificPricesDb.items.filter(
      (p) => !(p.dentistId === dentistId && p.serviceId === serviceId),
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/dentists/`, ({ request }) => {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const items = fakeDentistsDb.items
      .filter((d) => includeInactive || d.active)
      .sort((a, b) => a.name.localeCompare(b.name));
    return HttpResponse.json({ items });
  }),
  http.get(`${API_URL}/dentists/:id`, ({ params }) => {
    const found = fakeDentistsDb.items.find((d) => d.id === params.id);
    if (!found) {
      return HttpResponse.json({ error: "dentist_not_found" }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),
  http.post(`${API_URL}/dentists/`, async ({ request }) => {
    const body = (await request.json()) as Partial<FakeDentist>;
    const created = makeFakeDentist({
      name: body.name ?? "",
      cro: body.cro ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      notes: body.notes ?? null,
    });
    fakeDentistsDb.items.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${API_URL}/dentists/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<FakeDentist>;
    const idx = fakeDentistsDb.items.findIndex((d) => d.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "dentist_not_found" }, { status: 404 });
    }
    const updated = { ...fakeDentistsDb.items[idx], ...body, updatedAt: NOW };
    fakeDentistsDb.items[idx] = updated;
    return HttpResponse.json(updated);
  }),
  http.delete(`${API_URL}/dentists/:id`, ({ params }) => {
    const idx = fakeDentistsDb.items.findIndex((d) => d.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "dentist_not_found" }, { status: 404 });
    }
    fakeDentistsDb.items[idx] = {
      ...fakeDentistsDb.items[idx],
      active: false,
      updatedAt: NOW,
    };
    return new HttpResponse(null, { status: 204 });
  }),
];
