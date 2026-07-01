import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  makeFakeLabInfo,
  resetFakeLabInfoDb,
} from "@/mocks/handlers";
import SettingsPage from "@/pages/Settings";

describe("SettingsPage", () => {
  it("popula o formulário com os dados do laboratório", async () => {
    resetFakeLabInfoDb(
      makeFakeLabInfo({
        responsibleTechnician: "Maria Salgueiro",
        responsibleTechnicianCro: "CRO-RJ 123",
        phone: "21999998888",
        email: "lab@odontoarte.local",
      }),
    );

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/técnico responsável/i)).toHaveValue(
        "Maria Salgueiro",
      );
    });
    expect(screen.getByLabelText(/cro do técnico/i)).toHaveValue("CRO-RJ 123");
    expect(screen.getByLabelText(/telefone/i)).toHaveValue("(21) 99999-8888");
    expect(screen.getByLabelText(/email/i)).toHaveValue("lab@odontoarte.local");
    expect(screen.getByLabelText(/nome do laboratório/i)).toBeDisabled();
  });

  it("bloqueia submit quando email é inválido", async () => {
    resetFakeLabInfoDb(makeFakeLabInfo());

    renderWithProviders(<SettingsPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /salvar/i }),
      ).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/técnico responsável/i),
      "Maria",
    );
    await user.type(screen.getByLabelText(/cro do técnico/i), "CRO 1");
    await user.type(screen.getByLabelText(/telefone/i), "21999998888");
    await user.type(screen.getByLabelText(/email/i), "invalido");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument();
  });

  it("envia PUT com phone só dígitos e exibe toast de sucesso", async () => {
    resetFakeLabInfoDb(makeFakeLabInfo());

    let receivedBody: Record<string, unknown> = {};
    server.use(
      http.put(`${API_URL}/lab-info/`, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makeFakeLabInfo({
            responsibleTechnician: receivedBody.responsibleTechnician as string,
            responsibleTechnicianCro: receivedBody.responsibleTechnicianCro as string,
            phone: receivedBody.phone as string,
            email: receivedBody.email as string,
          }),
        );
      }),
    );

    renderWithProviders(<SettingsPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /salvar/i }),
      ).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/técnico responsável/i),
      "Maria Salgueiro",
    );
    await user.type(screen.getByLabelText(/cro do técnico/i), "CRO-RJ 123");
    await user.type(screen.getByLabelText(/telefone/i), "21999998888");
    await user.type(
      screen.getByLabelText(/email/i),
      "lab@odontoarte.local",
    );
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(receivedBody).toMatchObject({
        responsibleTechnician: "Maria Salgueiro",
        responsibleTechnicianCro: "CRO-RJ 123",
        phone: "21999998888",
        email: "lab@odontoarte.local",
      }),
    );

    expect(
      await screen.findByText(/configurações salvas/i),
    ).toBeInTheDocument();
  });

  it("exibe toast de erro quando o backend falha", async () => {
    resetFakeLabInfoDb(
      makeFakeLabInfo({
        responsibleTechnician: "Maria",
        responsibleTechnicianCro: "CRO 1",
        phone: "21999998888",
        email: "lab@odontoarte.local",
      }),
    );

    server.use(
      http.put(`${API_URL}/lab-info/`, () =>
        HttpResponse.json({ error: "validation_error" }, { status: 400 }),
      ),
    );

    renderWithProviders(<SettingsPage />);

    await waitFor(() =>
      expect(screen.getByLabelText(/técnico responsável/i)).toHaveValue(
        "Maria",
      ),
    );

    const user = userEvent.setup();
    const cro = screen.getByLabelText(/cro do técnico/i);
    await user.clear(cro);
    await user.type(cro, "CRO-RJ 222");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(
      await screen.findByText(/erro ao salvar configurações/i),
    ).toBeInTheDocument();
  });
});
