import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<div>login page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>protected content</div>} />
      </Route>
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  it("redireciona pra /login quando não há tokens", async () => {
    renderWithProviders(<App />, { initialEntries: ["/"] });

    await waitFor(() => {
      expect(screen.getByText("login page")).toBeInTheDocument();
    });
  });

  it("renderiza filhos quando há tokens e /me responde", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });

    renderWithProviders(<App />, { initialEntries: ["/"] });

    await waitFor(() => {
      expect(screen.getByText("protected content")).toBeInTheDocument();
    });
  });

  it("renderiza imediatamente quando o usuário já está hidratado", () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });
    useAuthStore.getState().setUser(FAKE_USER);

    renderWithProviders(<App />, { initialEntries: ["/"] });

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });
});
