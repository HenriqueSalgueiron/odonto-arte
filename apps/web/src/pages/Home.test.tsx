import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router";
import { renderWithProviders, screen } from "@/test-utils";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import HomePage from "@/pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

describe("HomePage", () => {
  it("mostra o nome do usuário logado", () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });
    useAuthStore.getState().setUser(FAKE_USER);

    renderWithProviders(<App />, { initialEntries: ["/"] });

    expect(
      screen.getByRole("heading", { name: new RegExp(FAKE_USER.name, "i") }),
    ).toBeInTheDocument();
  });

  it("oferece atalhos para Serviços, Dentistas e Configurações", () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });
    useAuthStore.getState().setUser(FAKE_USER);

    renderWithProviders(<App />, { initialEntries: ["/"] });

    expect(screen.getByRole("link", { name: /serviços/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dentistas/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /configurações/i }),
    ).toBeInTheDocument();
  });
});
