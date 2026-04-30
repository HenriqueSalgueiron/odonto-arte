import { describe, it, expect, beforeEach } from "vitest";
import { useForm } from "react-hook-form";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import {
  fakeCategoriesDb,
  fakeServicesDb,
  makeFakeCategory,
  makeFakeService,
  resetFakeCategoriesDb,
  resetFakeServicesDb,
} from "@/mocks/handlers";
import { useAuthStore } from "@/stores/authStore";
import { FAKE_USER } from "@/mocks/handlers";
import { RHFCategorySelect } from "@/components/form/RHFCategorySelect";

function authenticate() {
  useAuthStore.getState().setTokens({ accessToken: "a", refreshToken: "r" });
  useAuthStore.getState().setUser(FAKE_USER);
}

type FormValues = { categoryId: string | null };

function Harness({
  initialId = null,
  onChange,
}: {
  initialId?: string | null;
  onChange?: (value: string | null) => void;
}) {
  const { control, watch } = useForm<FormValues>({
    defaultValues: { categoryId: initialId },
  });
  const value = watch("categoryId");
  return (
    <div>
      <span data-testid="current-value">{value ?? "null"}</span>
      <RHFCategorySelect<FormValues>
        control={control}
        name="categoryId"
        label="Categoria"
        fullWidth
      />
      <button
        type="button"
        onClick={() => onChange?.(value)}
        data-testid="probe"
      >
        probe
      </button>
    </div>
  );
}

beforeEach(() => {
  authenticate();
  resetFakeCategoriesDb();
  resetFakeServicesDb();
});

describe("RHFCategorySelect", () => {
  it("renderiza opções existentes e seleciona uma categoria", async () => {
    fakeCategoriesDb.items = [
      makeFakeCategory({ id: "cat-1", name: "Próteses" }),
      makeFakeCategory({ id: "cat-2", name: "Placas" }),
    ];

    renderWithProviders(<Harness />);

    const trigger = screen.getByLabelText(/categoria/i, {
      selector: "input",
    });
    const user = userEvent.setup();
    await user.click(trigger);

    const placas = await screen.findByRole("menuitem", { name: /placas/i });
    await user.click(placas);

    await waitFor(() =>
      expect(screen.getByTestId("current-value").textContent).toBe("cat-2"),
    );
  });

  it("permite criar nova categoria inline e a seleciona automaticamente", async () => {
    renderWithProviders(<Harness />);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/categoria/i, { selector: "input" }));

    await user.click(
      await screen.findByRole("menuitem", { name: /nova categoria/i }),
    );

    const input = await screen.findByLabelText(/nova categoria/i, {
      selector: "input",
    });
    await user.type(input, "Próteses Removíveis");
    await user.click(screen.getByRole("button", { name: /criar categoria/i }));

    await waitFor(() => {
      expect(fakeCategoriesDb.items).toHaveLength(1);
    });
    expect(fakeCategoriesDb.items[0].name).toBe("Próteses Removíveis");

    await waitFor(() =>
      expect(screen.getByTestId("current-value").textContent).toBe(
        fakeCategoriesDb.items[0].id,
      ),
    );
  });

  it("bloqueia criar categoria com nome 'Diversos'", async () => {
    renderWithProviders(<Harness />);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/categoria/i, { selector: "input" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /nova categoria/i }),
    );

    await user.type(
      await screen.findByLabelText(/nova categoria/i, { selector: "input" }),
      "Diversos",
    );
    await user.click(screen.getByRole("button", { name: /criar categoria/i }));

    expect(await screen.findByText(/nome reservado/i)).toBeInTheDocument();
    expect(fakeCategoriesDb.items).toHaveLength(0);
  });

  it("renomeia categoria inline", async () => {
    fakeCategoriesDb.items = [
      makeFakeCategory({ id: "cat-1", name: "Próteses" }),
    ];

    renderWithProviders(<Harness />);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/categoria/i, { selector: "input" }));

    await user.click(
      await screen.findByRole("button", { name: /renomear próteses/i }),
    );

    const renameInput = await screen.findByLabelText(/renomear categoria/i);
    await user.clear(renameInput);
    await user.type(renameInput, "Próteses fixas");
    await user.click(screen.getByRole("button", { name: /salvar nome/i }));

    await waitFor(() => {
      expect(fakeCategoriesDb.items[0].name).toBe("Próteses fixas");
    });
  });

  it("excluir confirma com count de serviços e remove a categoria", async () => {
    const cat = makeFakeCategory({ id: "cat-1", name: "Próteses" });
    fakeCategoriesDb.items = [cat];
    fakeServicesDb.items = [
      makeFakeService({ name: "PPR", category: { id: cat.id, name: cat.name } }),
      makeFakeService({
        name: "Coroa",
        category: { id: cat.id, name: cat.name },
      }),
    ];

    renderWithProviders(<Harness />);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/categoria/i, { selector: "input" }));

    await user.click(
      await screen.findByRole("button", { name: /excluir próteses/i }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/2 serviços/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /excluir/i }));

    await waitFor(() => {
      expect(fakeCategoriesDb.items).toHaveLength(0);
    });
  });
});
