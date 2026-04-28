import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import HomePage from "@/pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<div>login page</div>} />
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

  it("clicar em Sair limpa store e leva pra /login", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });
    useAuthStore.getState().setUser(FAKE_USER);

    renderWithProviders(<App />, { initialEntries: ["/"] });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sair/i }));

    await waitFor(() => {
      expect(screen.getByText("login page")).toBeInTheDocument();
    });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
