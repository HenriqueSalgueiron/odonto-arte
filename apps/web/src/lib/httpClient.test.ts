import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { API_URL } from "@/mocks/handlers";
import client, { AUTH_LOGOUT_EVENT, axiosInstance } from "@/lib/httpClient";
import { useAuthStore } from "@/stores/authStore";

describe("httpClient", () => {
  it("anexa Authorization Bearer em rotas autenticadas", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "ACCESS",
      refreshToken: "REFRESH",
    });

    let received: string | null = null;
    server.use(
      http.get(`${API_URL}/auth/me`, ({ request }) => {
        received = request.headers.get("authorization");
        return HttpResponse.json({
          id: "u1",
          email: "a@b.com",
          nome: "Ana",
        });
      }),
    );

    await client({ method: "GET", url: "/auth/me" });
    expect(received).toBe("Bearer ACCESS");
  });

  it("não anexa Authorization no /auth/login", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "ACCESS",
      refreshToken: "REFRESH",
    });

    let received: string | null = "untouched";
    server.use(
      http.post(`${API_URL}/auth/login`, ({ request }) => {
        received = request.headers.get("authorization");
        return HttpResponse.json({
          accessToken: "x",
          refreshToken: "y",
        });
      }),
    );

    await client({
      method: "POST",
      url: "/auth/login",
      data: { email: "a@b.com", password: "p" },
    });
    expect(received).toBeNull();
  });

  it("em 401, faz refresh e retenta a request original com novo token", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "OLD",
      refreshToken: "REFRESH",
    });

    let meCalls = 0;
    let lastAuthHeader: string | null = null;
    server.use(
      http.get(`${API_URL}/auth/me`, ({ request }) => {
        meCalls += 1;
        lastAuthHeader = request.headers.get("authorization");
        if (meCalls === 1) {
          return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({
          id: "u1",
          email: "a@b.com",
          nome: "Ana",
        });
      }),
      http.post(`${API_URL}/auth/refresh`, () =>
        HttpResponse.json({
          accessToken: "NEW",
          refreshToken: "NEW_R",
        }),
      ),
    );

    const res = await client<{ id: string }>({
      method: "GET",
      url: "/auth/me",
    });

    expect(meCalls).toBe(2);
    expect(lastAuthHeader).toBe("Bearer NEW");
    expect(res.data).toMatchObject({ id: "u1" });
    expect(useAuthStore.getState().accessToken).toBe("NEW");
    expect(useAuthStore.getState().refreshToken).toBe("NEW_R");
  });

  it("se refresh falhar, limpa store e dispara evento auth:logout", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "OLD",
      refreshToken: "REFRESH",
    });

    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
      ),
      http.post(`${API_URL}/auth/refresh`, () =>
        HttpResponse.json({ error: "invalid_token" }, { status: 401 }),
      ),
    );

    const listener = vi.fn();
    window.addEventListener(AUTH_LOGOUT_EVENT, listener);

    await expect(
      client({ method: "GET", url: "/auth/me" }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(listener).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();

    window.removeEventListener(AUTH_LOGOUT_EVENT, listener);
  });

  it("não tenta refresh se a request 401 for o próprio /auth/refresh", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "ACCESS",
      refreshToken: "REFRESH",
    });

    let calls = 0;
    server.use(
      http.post(`${API_URL}/auth/refresh`, () => {
        calls += 1;
        return HttpResponse.json(
          { error: "invalid_token" },
          { status: 401 },
        );
      }),
    );

    await expect(
      axiosInstance.post("/auth/refresh", {
        accessToken: "x",
        refreshToken: "y",
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(calls).toBe(1);
  });

  it("colapsa múltiplos 401 paralelos em um único refresh (single-flight)", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "OLD",
      refreshToken: "REFRESH",
    });

    let refreshCalls = 0;
    let meCalls = 0;
    server.use(
      http.post(`${API_URL}/auth/refresh`, async () => {
        refreshCalls += 1;
        return HttpResponse.json({
          accessToken: "NEW",
          refreshToken: "NEW_R",
        });
      }),
      http.get(`${API_URL}/auth/me`, ({ request }) => {
        meCalls += 1;
        const auth = request.headers.get("authorization");
        if (auth === "Bearer NEW") {
          return HttpResponse.json({
            id: "u1",
            email: "a@b.com",
            nome: "Ana",
          });
        }
        return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
      }),
    );

    await Promise.all([
      client({ method: "GET", url: "/auth/me" }),
      client({ method: "GET", url: "/auth/me" }),
      client({ method: "GET", url: "/auth/me" }),
    ]);

    expect(refreshCalls).toBe(1);
    expect(meCalls).toBe(6);
  });
});
