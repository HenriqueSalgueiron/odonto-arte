import { describe, it, expect } from "vitest";
import {
  generateRefreshToken,
  refreshTokenKey,
  refreshTokenUserPrefix,
  timingSafeEqualStr,
} from "@/lib/refreshToken.js";

describe("refreshToken", () => {
  it("gera tokens distintos a cada chamada", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toEqual(b);
  });

  it("gera tokens em base64url (sem =, +, /)", () => {
    const t = generateRefreshToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("timingSafeEqualStr retorna true para strings iguais", () => {
    expect(timingSafeEqualStr("abc123", "abc123")).toBe(true);
  });

  it("timingSafeEqualStr retorna false para diferentes ou tamanhos diferentes", () => {
    expect(timingSafeEqualStr("abc", "xyz")).toBe(false);
    expect(timingSafeEqualStr("abc", "abcd")).toBe(false);
  });

  it("monta chave Redis no formato esperado", () => {
    expect(refreshTokenKey("u1", "t1")).toBe("refresh:u1:t1");
    expect(refreshTokenUserPrefix("u1")).toBe("refresh:u1:");
  });
});
