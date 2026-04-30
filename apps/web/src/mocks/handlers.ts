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

type FakeService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
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
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
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
    const body = (await request.json()) as Partial<FakeService>;
    const created = makeFakeService({
      name: body.name ?? "",
      description: body.description ?? null,
      price: body.price ?? 0,
    });
    fakeServicesDb.items.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put(`${API_URL}/services/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<FakeService>;
    const idx = fakeServicesDb.items.findIndex((s) => s.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    const updated = { ...fakeServicesDb.items[idx], ...body, updatedAt: NOW };
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
