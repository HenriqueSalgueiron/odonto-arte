import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/mocks/server";
import { API_URL, FAKE_USER } from "@/mocks/handlers";
import { useAuthStore } from "@/stores/authStore";
import LoginPage from "@/pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>home page</div>} />
    </Routes>
  );
}

describe("LoginPage", () => {
  it("valida campos obrigatórios", async () => {
    renderWithProviders(<App />, { initialEntries: ["/login"] });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("submete credenciais válidas e redireciona para /", async () => {
    renderWithProviders(<App />, { initialEntries: ["/login"] });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), FAKE_USER.email);
    await user.type(screen.getByLabelText(/senha/i), "secret");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
    expect(useAuthStore.getState().accessToken).not.toBeNull();
  });

  it("mostra mensagem de erro com 401", async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json(
          { error: "invalid_credentials" },
          { status: 401 },
        ),
      ),
    );

    renderWithProviders(<App />, { initialEntries: ["/login"] });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), "wrong@x.com");
    await user.type(screen.getByLabelText(/senha/i), "bad");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText(/email ou senha inválidos/i),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("redireciona pra / se já está autenticado", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });
    useAuthStore.getState().setUser(FAKE_USER);

    renderWithProviders(<App />, { initialEntries: ["/login"] });

    await waitFor(() => {
      expect(screen.getByText("home page")).toBeInTheDocument();
    });
  });
});
