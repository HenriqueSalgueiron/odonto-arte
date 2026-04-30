import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  fakeCategoriesDb,
  fakeServicesDb,
  makeFakeCategory,
  makeFakeService,
  resetFakeCategoriesDb,
} from "@/mocks/handlers";
import { ServiceFormDialog } from "@/pages/Services/ServiceFormDialog";
import { formatBRL } from "@/lib/formatters/currency";

beforeEach(() => {
  resetFakeCategoriesDb();
});

describe("ServiceFormDialog (create)", () => {
  it("exibe erro ao submeter sem nome", async () => {
    renderWithProviders(
      <ServiceFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/preço/i), "100,00");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
  });

  it("exibe erro com preço inválido", async () => {
    renderWithProviders(
      <ServiceFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "PPR");
    await user.type(screen.getByLabelText(/preço/i), "abc");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/preço inválido/i)).toBeInTheDocument();
  });

  it("submete POST /services e fecha dialog em sucesso", async () => {
    let received: { name?: string; description?: string | null; price?: number } =
      {};
    server.use(
      http.post(`${API_URL}/services/`, async ({ request }) => {
        received = (await request.json()) as typeof received;
        return HttpResponse.json(
          makeFakeService({ name: received.name ?? "" }),
          { status: 201 },
        );
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <ServiceFormDialog open mode="create" onClose={onClose} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "PPR");
    await user.type(screen.getByLabelText(/preço/i), "250,00");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(received).toMatchObject({
      name: "PPR",
      description: null,
      price: 250,
    });
    expect(await screen.findByText(/serviço criado/i)).toBeInTheDocument();
  });

  it("mostra mensagem de erro quando o backend retorna 400", async () => {
    server.use(
      http.post(`${API_URL}/services/`, () =>
        HttpResponse.json({ error: "validation_error" }, { status: 400 }),
      ),
    );

    renderWithProviders(
      <ServiceFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "PPR");
    await user.type(screen.getByLabelText(/preço/i), "250,00");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    expect(await screen.findByText(/erro ao salvar/i)).toBeInTheDocument();
  });
});

describe("ServiceFormDialog (edit)", () => {
  it("preenche campos com initial e dispara PUT", async () => {
    const initial = makeFakeService({
      id: "svc-1",
      name: "PPR",
      description: "Removível",
      price: 250,
      active: true,
    });
    fakeServicesDb.items = [initial];

    let receivedId: string | null = null;
    let receivedBody: Record<string, unknown> = {};
    server.use(
      http.put(`${API_URL}/services/:id`, async ({ params, request }) => {
        receivedId = params.id as string;
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...initial, ...receivedBody });
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <ServiceFormDialog
        open
        mode="edit"
        initial={initial}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText(/nome/i)).toHaveValue("PPR");
    expect(screen.getByLabelText(/preço/i)).toHaveValue(formatBRL(250));

    const user = userEvent.setup();
    const nameInput = screen.getByLabelText(/nome/i);
    await user.clear(nameInput);
    await user.type(nameInput, "PPR atualizado");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(receivedId).toBe("svc-1");
    expect(receivedBody).toMatchObject({
      name: "PPR atualizado",
      price: 250,
      active: true,
    });
  });

  it("permite alternar Switch ativo no modo edit", async () => {
    const initial = makeFakeService({
      id: "svc-2",
      name: "Coroa",
      price: 800,
      active: true,
    });
    fakeServicesDb.items = [initial];

    renderWithProviders(
      <ServiceFormDialog open mode="edit" initial={initial} onClose={() => {}} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/ativo/i)).toBeChecked();
  });
});

describe("ServiceFormDialog (categoria)", () => {
  it("envia categoryId no POST quando uma categoria é selecionada", async () => {
    fakeCategoriesDb.items = [
      makeFakeCategory({ id: "cat-1", name: "Próteses" }),
    ];

    let received: { name?: string; categoryId?: string | null } = {};
    server.use(
      http.post(`${API_URL}/services/`, async ({ request }) => {
        received = (await request.json()) as typeof received;
        return HttpResponse.json(
          makeFakeService({ name: received.name ?? "" }),
          { status: 201 },
        );
      }),
    );

    renderWithProviders(
      <ServiceFormDialog open mode="create" onClose={() => {}} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nome/i), "PPR");

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByLabelText(/categoria/i, { selector: "input" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /próteses/i }));

    await user.type(screen.getByLabelText(/preço/i), "250,00");
    await user.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => expect(received.categoryId).toBe("cat-1"));
  });

  it("inicializa o select com a categoria do serviço em modo edit", async () => {
    fakeCategoriesDb.items = [
      makeFakeCategory({ id: "cat-1", name: "Próteses" }),
    ];
    const initial = makeFakeService({
      id: "svc-1",
      name: "PPR",
      price: 250,
      category: { id: "cat-1", name: "Próteses" },
    });
    fakeServicesDb.items = [initial];

    renderWithProviders(
      <ServiceFormDialog open mode="edit" initial={initial} onClose={() => {}} />,
    );

    const categoryInput = await screen.findByLabelText(/categoria/i, {
      selector: "input",
    });
    await waitFor(() =>
      expect((categoryInput as HTMLInputElement).value).toBe("Próteses"),
    );
  });

  it("envia categoryId null quando 'Sem categoria' é selecionada", async () => {
    fakeCategoriesDb.items = [
      makeFakeCategory({ id: "cat-1", name: "Próteses" }),
    ];
    const initial = makeFakeService({
      id: "svc-1",
      name: "PPR",
      price: 250,
      category: { id: "cat-1", name: "Próteses" },
    });
    fakeServicesDb.items = [initial];

    let receivedBody: { categoryId?: string | null } = {};
    server.use(
      http.put(`${API_URL}/services/:id`, async ({ request }) => {
        receivedBody = (await request.json()) as typeof receivedBody;
        return HttpResponse.json({ ...initial, ...receivedBody, category: null });
      }),
    );

    const onClose = vi.fn();
    renderWithProviders(
      <ServiceFormDialog open mode="edit" initial={initial} onClose={onClose} />,
    );

    const user = userEvent.setup();
    await user.click(
      await screen.findByLabelText(/categoria/i, { selector: "input" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /sem categoria/i }),
    );

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(receivedBody.categoryId).toBeNull();
  });
});
