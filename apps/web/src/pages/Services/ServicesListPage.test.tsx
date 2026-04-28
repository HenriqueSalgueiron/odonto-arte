import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  fakeServicesDb,
  makeFakeService,
} from "@/mocks/handlers";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import ServicesListPage from "@/pages/Services";

function authenticate() {
  useAuthStore.getState().setTokens({
    accessToken: "a",
    refreshToken: "r",
  });
  useAuthStore.getState().setUser(FAKE_USER);
}

describe("ServicesListPage", () => {
  it("renderiza linhas a partir do GET /services", async () => {
    authenticate();
    fakeServicesDb.items = [
      makeFakeService({ name: "Coroa", price: 800 }),
      makeFakeService({ name: "PPR", price: 250 }),
    ];

    renderWithProviders(<ServicesListPage />);

    expect(await screen.findByText("PPR")).toBeInTheDocument();
    expect(screen.getByText("Coroa")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*250,00/)).toBeInTheDocument();
  });

  it("filtra por nome via busca client-side", async () => {
    authenticate();
    fakeServicesDb.items = [
      makeFakeService({ name: "Coroa", price: 800 }),
      makeFakeService({ name: "PPR", price: 250 }),
    ];

    renderWithProviders(<ServicesListPage />);

    await screen.findByText("PPR");

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/buscar por nome/i), "PPR");

    await waitFor(() => {
      expect(screen.queryByText("Coroa")).not.toBeInTheDocument();
    });
    expect(screen.getByText("PPR")).toBeInTheDocument();
  });

  it("toggle 'Mostrar inativos' envia includeInactive=true", async () => {
    authenticate();
    fakeServicesDb.items = [
      makeFakeService({ name: "Coroa", active: true }),
      makeFakeService({ name: "Onlay", active: false }),
    ];

    let lastIncludeInactive: string | null = null;
    server.use(
      http.get(`${API_URL}/services/`, ({ request }) => {
        const url = new URL(request.url);
        lastIncludeInactive = url.searchParams.get("includeInactive");
        const includeInactive = lastIncludeInactive === "true";
        const items = fakeServicesDb.items.filter(
          (s) => includeInactive || s.active,
        );
        return HttpResponse.json({ items });
      }),
    );

    renderWithProviders(<ServicesListPage />);

    await screen.findByText("Coroa");
    expect(lastIncludeInactive).toBeNull();
    expect(screen.queryByText("Onlay")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/mostrar inativos/i));

    await waitFor(() => expect(lastIncludeInactive).toBe("true"));
    expect(await screen.findByText("Onlay")).toBeInTheDocument();
  });

  it("clicar lixeira → cancelar não dispara DELETE", async () => {
    authenticate();
    fakeServicesDb.items = [makeFakeService({ id: "svc-x", name: "PPR" })];

    let deleteCalls = 0;
    server.use(
      http.delete(`${API_URL}/services/:id`, () => {
        deleteCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<ServicesListPage />);
    await screen.findByText("PPR");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /excluir ppr/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(deleteCalls).toBe(0);
  });

  it("clicar lixeira → confirmar dispara DELETE e invalida lista", async () => {
    authenticate();
    fakeServicesDb.items = [makeFakeService({ id: "svc-y", name: "PPR" })];

    let deletedId: string | null = null;
    server.use(
      http.delete(`${API_URL}/services/:id`, ({ params }) => {
        deletedId = params.id as string;
        const idx = fakeServicesDb.items.findIndex((s) => s.id === deletedId);
        if (idx !== -1) {
          fakeServicesDb.items[idx] = {
            ...fakeServicesDb.items[idx],
            active: false,
          };
        }
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<ServicesListPage />);
    await screen.findByText("PPR");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /excluir ppr/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /desativar/i }));

    await waitFor(() => expect(deletedId).toBe("svc-y"));
    await waitFor(() => {
      expect(screen.queryByText("PPR")).not.toBeInTheDocument();
    });
  });

  it("mostra mensagem vazia quando não há serviços", async () => {
    authenticate();
    fakeServicesDb.items = [];

    renderWithProviders(<ServicesListPage />);

    expect(
      await screen.findByText(/nenhum serviço cadastrado/i),
    ).toBeInTheDocument();
  });
});
