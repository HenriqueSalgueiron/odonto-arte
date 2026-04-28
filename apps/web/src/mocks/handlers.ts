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
];
