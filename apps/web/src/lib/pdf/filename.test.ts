import { describe, it, expect } from "vitest";
import { pdfFilename } from "@/lib/pdf/filename";

describe("pdfFilename", () => {
  it("formata a data no padrão tabela-de-precos-YYYY-MM-DD.pdf", () => {
    expect(pdfFilename(new Date(2026, 4, 18))).toBe(
      "tabela-de-precos-2026-05-18.pdf",
    );
  });

  it("pad de zero para mês e dia < 10", () => {
    expect(pdfFilename(new Date(2026, 0, 5))).toBe(
      "tabela-de-precos-2026-01-05.pdf",
    );
  });

  it("dezembro / dia 31", () => {
    expect(pdfFilename(new Date(2026, 11, 31))).toBe(
      "tabela-de-precos-2026-12-31.pdf",
    );
  });
});
