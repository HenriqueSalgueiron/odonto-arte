import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import { AppLayout } from "@/components/AppLayout";

function TestApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<div>home content</div>} />
        <Route path="/services" element={<div>services content</div>} />
        <Route path="/dentists" element={<div>dentists content</div>} />
        <Route path="/settings" element={<div>settings content</div>} />
      </Route>
      <Route path="/login" element={<div>login page</div>} />
    </Routes>
  );
}

function authenticate() {
  useAuthStore.getState().setTokens({
    accessToken: "a",
    refreshToken: "r",
  });
  useAuthStore.getState().setUser(FAKE_USER);
}

describe("AppLayout", () => {
  it("renderiza os 4 links de navegação no header", () => {
    authenticate();
    renderWithProviders(<TestApp />, { initialEntries: ["/"] });

    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(
      within(banner).getByRole("link", { name: /serviços/i }),
    ).toBeInTheDocument();
    expect(
      within(banner).getByRole("link", { name: /dentistas/i }),
    ).toBeInTheDocument();
    expect(
      within(banner).getByRole("link", { name: /configurações/i }),
    ).toBeInTheDocument();
  });

  it("navega entre rotas ao clicar nos links", async () => {
    authenticate();
    renderWithProviders(<TestApp />, { initialEntries: ["/"] });

    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: /configurações/i }));
    expect(await screen.findByText("settings content")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /dentistas/i }));
    expect(await screen.findByText("dentists content")).toBeInTheDocument();
  });

  it("clicar em Sair limpa store e leva pra /login", async () => {
    authenticate();
    renderWithProviders(<TestApp />, { initialEntries: ["/"] });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sair/i }));

    await waitFor(() => {
      expect(screen.getByText("login page")).toBeInTheDocument();
    });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
