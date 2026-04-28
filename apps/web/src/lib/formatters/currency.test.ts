import { describe, it, expect } from "vitest";
import { formatBRL, parseBRLInput } from "@/lib/formatters/currency";

describe("formatBRL", () => {
  it("formata zero", () => {
    expect(formatBRL(0)).toMatch(/R\$\s*0,00/);
  });

  it("formata valor com centavos", () => {
    expect(formatBRL(1234.5)).toMatch(/R\$\s*1\.234,50/);
  });

  it("arredonda valores fracionários conforme Intl", () => {
    expect(formatBRL(10.5)).toMatch(/R\$\s*10,50/);
  });
});

describe("parseBRLInput", () => {
  it("converte string com R$ e separadores brasileiros", () => {
    expect(parseBRLInput("R$ 1.234,50")).toBe(1234.5);
  });

  it("converte string só com vírgula", () => {
    expect(parseBRLInput("250,00")).toBe(250);
  });

  it("retorna null para string vazia", () => {
    expect(parseBRLInput("")).toBeNull();
  });

  it("retorna null para texto não numérico", () => {
    expect(parseBRLInput("abc")).toBeNull();
  });

  it("preserva centavos em round-trip", () => {
    const value = 1234.5;
    const parsed = parseBRLInput(formatBRL(value));
    expect(parsed).toBe(value);
  });
});
