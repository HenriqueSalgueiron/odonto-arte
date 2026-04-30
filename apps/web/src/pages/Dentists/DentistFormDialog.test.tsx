import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  fakeDentistsDb,
  makeFakeDentist,
} from "@/mocks/handlers";
import { DentistFormDialog } from "@/pages/Dentists/DentistFormDialog";

describe("DentistFormDialog (create)", () => {
  it("exibe erro ao submeter sem nome", async () => {
    renderWithProviders(
      <DentistFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
  });

  it("bloqueia submit com email mal formado", async () => {
    renderWithProviders(
      <DentistFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "Dr. Silva");
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument();
  });

  it("submete POST /dentists com phone sem máscara e fecha dialog", async () => {
    let received: Record<string, unknown> = {};
    server.use(
      http.post(`${API_URL}/dentists/`, async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makeFakeDentist({ name: (received.name as string) ?? "" }),
          { status: 201 },
        );
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <DentistFormDialog open mode="create" onClose={onClose} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "Dr. Silva");
    await user.type(screen.getByLabelText(/telefone/i), "11999998888");
    await user.type(screen.getByLabelText(/email/i), "silva@example.com");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(received).toMatchObject({
      name: "Dr. Silva",
      phone: "11999998888",
      email: "silva@example.com",
      cro: null,
      notes: null,
    });
    expect(await screen.findByText(/dentista criado/i)).toBeInTheDocument();
  });

  it("mostra mensagem de erro quando o backend retorna 400", async () => {
    server.use(
      http.post(`${API_URL}/dentists/`, () =>
        HttpResponse.json({ error: "validation_error" }, { status: 400 }),
      ),
    );

    renderWithProviders(
      <DentistFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "Dr. Silva");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/erro ao salvar/i)).toBeInTheDocument();
  });
});

describe("DentistFormDialog (edit)", () => {
  it("preenche campos com initial e dispara PUT", async () => {
    const initial = makeFakeDentist({
      id: "dent-1",
      name: "Dr. Silva",
      cro: "CRO-SP 123",
      phone: "11999998888",
      email: "silva@example.com",
      active: true,
    });
    fakeDentistsDb.items = [initial];

    let receivedId: string | null = null;
    let receivedBody: Record<string, unknown> = {};
    server.use(
      http.put(`${API_URL}/dentists/:id`, async ({ params, request }) => {
        receivedId = params.id as string;
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...initial, ...receivedBody });
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <DentistFormDialog
        open
        mode="edit"
        initial={initial}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText(/nome/i)).toHaveValue("Dr. Silva");
    expect(screen.getByLabelText(/telefone/i)).toHaveValue("(11) 99999-8888");

    const user = userEvent.setup();
    const nameInput = screen.getByLabelText(/nome/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Dr. Silva Jr.");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(receivedId).toBe("dent-1");
    expect(receivedBody).toMatchObject({
      name: "Dr. Silva Jr.",
      phone: "11999998888",
      email: "silva@example.com",
      active: true,
    });
  });

  it("permite alternar Switch ativo no modo edit", async () => {
    const initial = makeFakeDentist({
      id: "dent-2",
      name: "Dra. Souza",
      active: true,
    });
    fakeDentistsDb.items = [initial];

    renderWithProviders(
      <DentistFormDialog
        open
        mode="edit"
        initial={initial}
        onClose={() => {}}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/ativo/i)).toBeChecked();
  });
});
