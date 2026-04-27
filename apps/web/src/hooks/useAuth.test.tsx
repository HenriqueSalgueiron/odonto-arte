import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { server } from "@/mocks/server";
import { API_URL, FAKE_TOKENS, FAKE_USER } from "@/mocks/handlers";
import { createQueryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";

function wrapper() {
  const qc = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useAuth", () => {
  it("login grava tokens, busca /me e marca authenticated", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });

    await act(async () => {
      await result.current.login({
        email: "ana@odontoarte.test",
        password: "secret",
      });
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toEqual(FAKE_USER);
    expect(useAuthStore.getState().accessToken).toBe(FAKE_TOKENS.accessToken);
  });

  it("propaga erro de login (credenciais inválidas)", async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json(
          { error: "invalid_credentials" },
          { status: 401 },
        ),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });

    await expect(
      result.current.login({ email: "x@y.com", password: "wrong" }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("logout limpa store e remove cache de /me", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });

    await act(async () => {
      await result.current.login({
        email: "ana@odontoarte.test",
        password: "secret",
      });
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("hidrata o usuário a partir de /me quando já existem tokens (bootstrapping)", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "existing.access",
      refreshToken: "existing.refresh",
    });

    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.user).toEqual(FAKE_USER));
    expect(result.current.isAuthenticated).toBe(true);
  });
});
