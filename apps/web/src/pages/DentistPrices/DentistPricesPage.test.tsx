import { describe, it, expect } from "vitest";
import { Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  FAKE_USER,
  fakeDentistsDb,
  fakeServicesDb,
  fakeSpecificPricesDb,
  makeFakeDentist,
  makeFakeService,
  makeFakeSpecificPrice,
} from "@/mocks/handlers";
import { useAuthStore } from "@/stores/authStore";
import { DentistPricesPage } from "@/pages/DentistPrices/DentistPricesPage";

function authenticate() {
  useAuthStore.getState().setTokens({
    accessToken: "a",
    refreshToken: "r",
  });
  useAuthStore.getState().setUser(FAKE_USER);
}

function renderAt(dentistId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/dentists/:id/prices" element={<DentistPricesPage />} />
    </Routes>,
    { initialEntries: [`/dentists/${dentistId}/prices`] },
  );
}

describe("DentistPricesPage", () => {
  it("renderiza nome do dentista no header", async () => {
    authenticate();
    const dentist = makeFakeDentist({ id: "d1", name: "Dr. Silva" });
    fakeDentistsDb.items = [dentist];

    renderAt(dentist.id);

    expect(await screen.findByText("Dr. Silva")).toBeInTheDocument();
  });

  it("renderiza uma linha por serviço com preço-tabela e específico nulo", async () => {
    authenticate();
    const dentist = makeFakeDentist({ id: "d2", name: "Dr. Souza" });
    fakeDentistsDb.items = [dentist];
    fakeServicesDb.items = [
      makeFakeService({ id: "s1", name: "Coroa", price: 800 }),
      makeFakeService({ id: "s2", name: "PPR", price: 250 }),
    ];

    renderAt(dentist.id);

    const coroaRow = (await screen.findByText("Coroa")).closest("tr")!;
    // tabela e efetivo são iguais quando não há override
    expect(within(coroaRow).getAllByText("R$ 800,00")).toHaveLength(2);
    // específico vazio "—"
    expect(within(coroaRow).getByText("—")).toBeInTheDocument();
  });

  it("usa preço específico como efetivo quando há override", async () => {
    authenticate();
    const dentist = makeFakeDentist({ id: "d3", name: "Dra. Lima" });
    fakeDentistsDb.items = [dentist];
    fakeServicesDb.items = [
      makeFakeService({ id: "s3", name: "Placa", price: 400 }),
    ];
    fakeSpecificPricesDb.items = [
      makeFakeSpecificPrice({
        dentistId: dentist.id,
        serviceId: "s3",
        price: 350,
      }),
    ];

    renderAt(dentist.id);

    const row = (await screen.findByText("Placa")).closest("tr")!;
    expect(within(row).getByText("R$ 400,00")).toBeInTheDocument();
    expect(within(row).getAllByText("R$ 350,00")).toHaveLength(2);
  });

  it("Remover só aparece em linha com override", async () => {
    authenticate();
    const dentist = makeFakeDentist({ id: "d4", name: "Dr. X" });
    fakeDentistsDb.items = [dentist];
    fakeServicesDb.items = [
      makeFakeService({ id: "s-no", name: "SemOverride", price: 100 }),
      makeFakeService({ id: "s-yes", name: "ComOverride", price: 200 }),
    ];
    fakeSpecificPricesDb.items = [
      makeFakeSpecificPrice({
        dentistId: dentist.id,
        serviceId: "s-yes",
        price: 180,
      }),
    ];

    renderAt(dentist.id);

    await screen.findByText("SemOverride");

    const user = userEvent.setup();

    // Linha sem override: o menu não deve ter o item "Remover preço específico".
    await user.click(
      screen.getByRole("button", { name: /mais ações para semoverride/i }),
    );
    expect(
      screen.queryByRole("menuitem", { name: /remover preço específico/i }),
    ).not.toBeInTheDocument();
    // Fecha o menu (clique fora)
    await user.keyboard("{Escape}");

    // Linha com override: o menu deve ter o item "Remover preço específico".
    await user.click(
      screen.getByRole("button", { name: /mais ações para comoverride/i }),
    );
    expect(
      screen.getByRole("menuitem", { name: /remover preço específico/i }),
    ).toBeInTheDocument();
  });

  it("clicar em Remover → confirmar dispara DELETE e atualiza linha", async () => {
    authenticate();
    const dentist = makeFakeDentist({ id: "d5", name: "Dr. Y" });
    fakeDentistsDb.items = [dentist];
    fakeServicesDb.items = [
      makeFakeService({ id: "s5", name: "Servico5", price: 100 }),
    ];
    fakeSpecificPricesDb.items = [
      makeFakeSpecificPrice({
        dentistId: dentist.id,
        serviceId: "s5",
        price: 75,
      }),
    ];

    renderAt(dentist.id);

    const row1 = (await screen.findByText("Servico5")).closest("tr")!;
    expect(within(row1).getAllByText("R$ 75,00")).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /mais ações para servico5/i }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: /remover preço específico/i }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /remover/i }));

    await waitFor(() => {
      const row2 = screen.getByText("Servico5").closest("tr")!;
      expect(within(row2).queryByText("R$ 75,00")).not.toBeInTheDocument();
    });
  });

  it("renderiza Alert em erro", async () => {
    authenticate();
    const dentist = makeFakeDentist({ id: "d6", name: "Dr. Z" });
    fakeDentistsDb.items = [dentist];

    server.use(
      http.get(`${API_URL}/dentists/:dentistId/prices/`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    renderAt(dentist.id);

    expect(
      await screen.findByText(/erro ao carregar preços do dentista/i),
    ).toBeInTheDocument();
  });
});
