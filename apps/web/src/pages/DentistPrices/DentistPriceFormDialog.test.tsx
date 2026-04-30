import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/mocks/server";
import { API_URL, makeFakeSpecificPrice } from "@/mocks/handlers";
import { DentistPriceFormDialog } from "@/pages/DentistPrices/DentistPriceFormDialog";
import { formatBRL } from "@/lib/formatters/currency";

describe("DentistPriceFormDialog (create)", () => {
  it("renderiza nome do serviço e preço-tabela read-only, input vazio", () => {
    renderWithProviders(
      <DentistPriceFormDialog
        open
        dentistId="d1"
        serviceId="s1"
        serviceName="Coroa"
        tablePrice={800}
        initialSpecificPrice={null}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Coroa")).toBeInTheDocument();
    expect(screen.getByText("R$ 800,00")).toBeInTheDocument();
    expect(screen.getByLabelText(/novo preço/i)).toHaveValue("");
  });

  it("submete PUT com preço parseado, mostra notificação e fecha", async () => {
    let received: { dentistId?: string; serviceId?: string; price?: number } = {};
    server.use(
      http.put(
        `${API_URL}/dentists/:dentistId/prices/:serviceId`,
        async ({ params, request }) => {
          const body = (await request.json()) as { price: number };
          received = {
            dentistId: params.dentistId as string,
            serviceId: params.serviceId as string,
            price: body.price,
          };
          return HttpResponse.json(
            makeFakeSpecificPrice({
              dentistId: received.dentistId!,
              serviceId: received.serviceId!,
              price: body.price,
            }),
          );
        },
      ),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <DentistPriceFormDialog
        open
        dentistId="d1"
        serviceId="s1"
        serviceName="Coroa"
        tablePrice={800}
        initialSpecificPrice={null}
        onClose={onClose}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/novo preço/i), "75050");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(received).toMatchObject({
      dentistId: "d1",
      serviceId: "s1",
      price: 750.5,
    });
    expect(await screen.findByText(/preço específico salvo/i)).toBeInTheDocument();
  });

  it("mostra erro quando o backend retorna 400 e mantém aberto", async () => {
    server.use(
      http.put(`${API_URL}/dentists/:dentistId/prices/:serviceId`, () =>
        HttpResponse.json({ error: "validation_error" }, { status: 400 }),
      ),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <DentistPriceFormDialog
        open
        dentistId="d1"
        serviceId="s1"
        serviceName="Coroa"
        tablePrice={800}
        initialSpecificPrice={null}
        onClose={onClose}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/novo preço/i), "10000");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/erro ao salvar preço/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Cancelar fecha sem chamar a mutation", async () => {
    let calls = 0;
    server.use(
      http.put(`${API_URL}/dentists/:dentistId/prices/:serviceId`, () => {
        calls += 1;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <DentistPriceFormDialog
        open
        dentistId="d1"
        serviceId="s1"
        serviceName="Coroa"
        tablePrice={800}
        initialSpecificPrice={null}
        onClose={onClose}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
    expect(calls).toBe(0);
  });
});

describe("DentistPriceFormDialog (edit)", () => {
  it("pré-preenche o input com o override existente", () => {
    renderWithProviders(
      <DentistPriceFormDialog
        open
        dentistId="d1"
        serviceId="s1"
        serviceName="Coroa"
        tablePrice={800}
        initialSpecificPrice={750.5}
        onClose={() => {}}
      />,
    );

    expect(screen.getByLabelText(/novo preço/i)).toHaveValue(formatBRL(750.5));
  });
});
