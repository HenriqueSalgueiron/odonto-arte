import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { API_URL } from "@/mocks/handlers";
import { logoutSession } from "@/lib/auth";
import { useAuthStore } from "@/stores/authStore";

describe("logoutSession", () => {
  it("chama POST /auth/logout com tokens atuais e limpa store", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "A",
      refreshToken: "R",
    });
    useAuthStore.getState().setUser({
      id: "u1",
      email: "a@b.com",
      nome: "Ana",
    });

    let received: { accessToken: string; refreshToken: string } | null = null;
    server.use(
      http.post(`${API_URL}/auth/logout`, async ({ request }) => {
        received = (await request.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await logoutSession();

    expect(received).toEqual({ accessToken: "A", refreshToken: "R" });
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("limpa store mesmo se /auth/logout falhar", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "A",
      refreshToken: "R",
    });

    server.use(
      http.post(`${API_URL}/auth/logout`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    await logoutSession();

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("não chama o backend se não houver tokens", async () => {
    let called = false;
    server.use(
      http.post(`${API_URL}/auth/logout`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await logoutSession();

    expect(called).toBe(false);
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
