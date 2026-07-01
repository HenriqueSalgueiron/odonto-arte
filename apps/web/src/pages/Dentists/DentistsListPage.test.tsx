import { describe, it, expect } from "vitest";
import { Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  fakeDentistsDb,
  makeFakeDentist,
} from "@/mocks/handlers";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import DentistsListPage from "@/pages/Dentists";

function authenticate() {
  useAuthStore.getState().setTokens({
    accessToken: "a",
    refreshToken: "r",
  });
  useAuthStore.getState().setUser(FAKE_USER);
}

describe("DentistsListPage", () => {
  it("renderiza linhas a partir do GET /dentists", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({
        name: "Dr. Silva",
        cro: "CRO-SP 123",
        phone: "11999998888",
      }),
      makeFakeDentist({
        name: "Dra. Souza",
        cro: "CRO-RJ 456",
        email: "souza@example.com",
      }),
    ];

    renderWithProviders(<DentistsListPage />);

    expect(await screen.findByText("Dr. Silva")).toBeInTheDocument();
    expect(screen.getByText("Dra. Souza")).toBeInTheDocument();
    expect(screen.getByText("(11) 99999-8888")).toBeInTheDocument();
    expect(screen.getByText("CRO-SP 123")).toBeInTheDocument();
  });

  it("filtra por nome via busca client-side", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({ name: "Dr. Silva" }),
      makeFakeDentist({ name: "Dra. Souza" }),
    ];

    renderWithProviders(<DentistsListPage />);

    await screen.findByText("Dr. Silva");

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/buscar por nome/i), "Souza");

    await waitFor(() => {
      expect(screen.queryByText("Dr. Silva")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Dra. Souza")).toBeInTheDocument();
  });

  it("toggle 'Mostrar inativos' envia includeInactive=true", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({ name: "Dr. Ativo", active: true }),
      makeFakeDentist({ name: "Dr. Inativo", active: false }),
    ];

    let lastIncludeInactive: string | null = null;
    server.use(
      http.get(`${API_URL}/dentists/`, ({ request }) => {
        const url = new URL(request.url);
        lastIncludeInactive = url.searchParams.get("includeInactive");
        const includeInactive = lastIncludeInactive === "true";
        const items = fakeDentistsDb.items.filter(
          (d) => includeInactive || d.active,
        );
        return HttpResponse.json({ items });
      }),
    );

    renderWithProviders(<DentistsListPage />);

    await screen.findByText("Dr. Ativo");
    expect(lastIncludeInactive).toBeNull();
    expect(screen.queryByText("Dr. Inativo")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/mostrar inativos/i));

    await waitFor(() => expect(lastIncludeInactive).toBe("true"));
    expect(await screen.findByText("Dr. Inativo")).toBeInTheDocument();
  });

  it("clicar lixeira → cancelar não dispara DELETE", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({ id: "dent-x", name: "Dr. Silva" }),
    ];

    let deleteCalls = 0;
    server.use(
      http.delete(`${API_URL}/dentists/:id`, () => {
        deleteCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<DentistsListPage />);
    await screen.findByText("Dr. Silva");

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /mais ações para dr\. silva/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /desativar/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(deleteCalls).toBe(0);
  });

  it("clicar lixeira → confirmar dispara DELETE e invalida lista", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({ id: "dent-y", name: "Dr. Silva" }),
    ];

    let deletedId: string | null = null;
    server.use(
      http.delete(`${API_URL}/dentists/:id`, ({ params }) => {
        deletedId = params.id as string;
        const idx = fakeDentistsDb.items.findIndex((d) => d.id === deletedId);
        if (idx !== -1) {
          fakeDentistsDb.items[idx] = {
            ...fakeDentistsDb.items[idx],
            active: false,
          };
        }
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<DentistsListPage />);
    await screen.findByText("Dr. Silva");

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /mais ações para dr\. silva/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /desativar/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /desativar/i }));

    await waitFor(() => expect(deletedId).toBe("dent-y"));
    await waitFor(() => {
      expect(screen.queryByText("Dr. Silva")).not.toBeInTheDocument();
    });
  });

  it("mostra mensagem vazia quando não há dentistas", async () => {
    authenticate();
    fakeDentistsDb.items = [];

    renderWithProviders(<DentistsListPage />);

    expect(
      await screen.findByText(/nenhum dentista cadastrado/i),
    ).toBeInTheDocument();
  });

  it("clicar no ícone Preços de dentista ativo navega para /dentists/:id/prices", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({ id: "dent-p", name: "Dr. Silva", active: true }),
    ];

    renderWithProviders(
      <Routes>
        <Route path="/dentists" element={<DentistsListPage />} />
        <Route
          path="/dentists/:id/prices"
          element={<div>Página de preços</div>}
        />
      </Routes>,
      { initialEntries: ["/dentists"] },
    );

    await screen.findByText("Dr. Silva");

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /mais ações para dr\. silva/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /preços/i }));

    expect(await screen.findByText(/página de preços/i)).toBeInTheDocument();
  });

  it("não mostra ícone Preços para dentista inativo", async () => {
    authenticate();
    fakeDentistsDb.items = [
      makeFakeDentist({ id: "dent-off", name: "Dr. Off", active: false }),
    ];

    renderWithProviders(<DentistsListPage />, {
      initialEntries: ["/dentists"],
    });

    // Toggle para ver inativos
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/mostrar inativos/i));

    await screen.findByText("Dr. Off");
    // Abre o menu de ações; item "Preços" não deve aparecer para inativos.
    await user.click(
      screen.getByRole("button", { name: /mais ações para dr\. off/i }),
    );
    expect(
      screen.queryByRole("menuitem", { name: /^preços$/i }),
    ).not.toBeInTheDocument();
  });
});
