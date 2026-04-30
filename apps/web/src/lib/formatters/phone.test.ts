import { describe, it, expect } from "vitest";
import { maskBRPhone, unmaskPhone } from "@/lib/formatters/phone";

describe("maskBRPhone", () => {
  it("retorna string vazia para entrada vazia", () => {
    expect(maskBRPhone("")).toBe("");
  });

  it("aplica máscara progressivamente conforme dígitos", () => {
    expect(maskBRPhone("1")).toBe("(1");
    expect(maskBRPhone("11")).toBe("(11");
    expect(maskBRPhone("119")).toBe("(11) 9");
    expect(maskBRPhone("119999")).toBe("(11) 9999");
    expect(maskBRPhone("1199998")).toBe("(11) 9999-8");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(maskBRPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("formata celular com 11 dígitos", () => {
    expect(maskBRPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("ignora caracteres não numéricos no input", () => {
    expect(maskBRPhone("(11) 99999-8888")).toBe("(11) 99999-8888");
    expect(maskBRPhone("+55 11 99999-8888")).toBe("(55) 11999-9988");
    expect(maskBRPhone("abc")).toBe("");
  });

  it("trunca além de 11 dígitos", () => {
    expect(maskBRPhone("119999988881234")).toBe("(11) 99999-8888");
  });
});

describe("unmaskPhone", () => {
  it("extrai apenas dígitos", () => {
    expect(unmaskPhone("(11) 99999-8888")).toBe("11999998888");
  });

  it("retorna string vazia quando não há dígitos", () => {
    expect(unmaskPhone("")).toBe("");
    expect(unmaskPhone("()-")).toBe("");
  });

  it("trunca em 11 dígitos", () => {
    expect(unmaskPhone("119999988881234")).toBe("11999998888");
  });
});
