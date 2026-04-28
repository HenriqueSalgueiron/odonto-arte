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
];
