import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  API_URL,
  makeFakeCategory,
  makeFakeExportTemplate,
  makeFakeLabInfo,
  makeFakeService,
  resetFakeCategoriesDb,
  resetFakeExportTemplateDb,
  resetFakeLabInfoDb,
  resetFakeServicesDb,
} from "@/mocks/handlers";

const downloadPdfMock = vi.fn(async () => {});

vi.mock("@/lib/pdf/downloadPdf", () => ({
  downloadPdf: (...args: unknown[]) => downloadPdfMock(...args),
}));

import { ExportPdfDialog } from "@/components/ExportPdfDialog/ExportPdfDialog";

const CAT_A = "11111111-1111-4111-8111-111111111111";
const CAT_B = "22222222-2222-4222-8222-222222222222";

function setupConfiguredLab() {
  resetFakeLabInfoDb(
    makeFakeLabInfo({
      responsibleTechnician: "Maria",
      responsibleTechnicianCro: "9166",
      phone: "21999998888",
      email: "lab@odontoarte.local",
    }),
  );
}

beforeEach(() => {
  downloadPdfMock.mockClear();
  resetFakeCategoriesDb([
    makeFakeCategory({ id: CAT_A, name: "Alfa" }),
    makeFakeCategory({ id: CAT_B, name: "Beta" }),
  ]);
  resetFakeServicesDb([
    makeFakeService({
      name: "Serviço Alfa 1",
      price: 100,
      category: { id: CAT_A, name: "Alfa" },
    }),
    makeFakeService({
      name: "Serviço Beta 1",
      price: 200,
      category: { id: CAT_B, name: "Beta" },
    }),
  ]);
});

describe("ExportPdfDialog", () => {
  it("mostra aviso e link para /settings quando lab não está configurado", async () => {
    resetFakeLabInfoDb(makeFakeLabInfo());

    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);

    await waitFor(() =>
      expect(
        screen.getByText(/configure as informações do laboratório/i),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /ir para configurações/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /exportar/i }),
    ).not.toBeInTheDocument();
  });

  it("inicializa categorias na ordem do template salvo", async () => {
    setupConfiguredLab();
    resetFakeExportTemplateDb(
      makeFakeExportTemplate({
        categoryOrder: [CAT_B, CAT_A],
        observations: ["Obs salva"],
      }),
    );

    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Beta")).toBeInTheDocument();
      expect(screen.getByText("Alfa")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Obs salva")).toBeInTheDocument();
  });

  it('"Diversos" aparece como rótulo fixo "Sempre no final"', async () => {
    setupConfiguredLab();
    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Diversos")).toBeInTheDocument());
    expect(screen.getByText(/sempre no final/i)).toBeInTheDocument();
  });

  it("permite adicionar e remover observação", async () => {
    setupConfiguredLab();
    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);
    await waitFor(() =>
      expect(screen.getByText(/observações/i)).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /adicionar observação/i }));

    const input = screen.getByLabelText(/^observação 1$/i);
    await user.type(input, "Nova obs");
    expect(input).toHaveValue("Nova obs");

    await user.click(
      screen.getByRole("button", { name: /remover observação 1/i }),
    );
    expect(screen.queryByLabelText(/^observação 1$/i)).not.toBeInTheDocument();
  });

  it("modo geral: NÃO mostra o alert de equivalência ao geral", async () => {
    setupConfiguredLab();
    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);
    await waitFor(() =>
      expect(screen.getByText(/observações/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/visualmente idêntico à tabela geral/i),
    ).not.toBeInTheDocument();
  });

  it("modo por-dentista: mostra alert de equivalência", async () => {
    setupConfiguredLab();
    server.use(
      http.get(
        `${API_URL}/dentists/:dentistId/prices`,
        () => HttpResponse.json({ items: [] }),
      ),
    );
    renderWithProviders(
      <ExportPdfDialog open onClose={() => {}} dentistId="d1" />,
    );
    await waitFor(() =>
      expect(
        screen.getByText(/visualmente idêntico à tabela geral/i),
      ).toBeInTheDocument(),
    );
  });

  it("exportar sem mudanças NÃO dispara PUT no template", async () => {
    setupConfiguredLab();
    resetFakeExportTemplateDb(
      makeFakeExportTemplate({
        categoryOrder: [CAT_A, CAT_B],
        observations: [],
      }),
    );

    let putCount = 0;
    server.use(
      http.put(`${API_URL}/export-template/`, async () => {
        putCount += 1;
        return HttpResponse.json(makeFakeExportTemplate());
      }),
    );

    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Alfa")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /exportar/i }));

    await waitFor(() => expect(downloadPdfMock).toHaveBeenCalledTimes(1));
    expect(putCount).toBe(0);
  });

  it("exportar com observação nova dispara PUT antes do download", async () => {
    setupConfiguredLab();
    resetFakeExportTemplateDb(
      makeFakeExportTemplate({
        categoryOrder: [CAT_A, CAT_B],
        observations: [],
      }),
    );

    let putCount = 0;
    server.use(
      http.put(`${API_URL}/export-template/`, async () => {
        putCount += 1;
        return HttpResponse.json(
          makeFakeExportTemplate({
            categoryOrder: [CAT_A, CAT_B],
            observations: ["Nova"],
          }),
        );
      }),
    );

    renderWithProviders(<ExportPdfDialog open onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Alfa")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /adicionar observação/i }));
    await user.type(screen.getByLabelText(/^observação 1$/i), "Nova");
    await user.click(screen.getByRole("button", { name: /exportar/i }));

    await waitFor(() => expect(putCount).toBe(1));
    expect(downloadPdfMock).toHaveBeenCalledTimes(1);
  });

});
