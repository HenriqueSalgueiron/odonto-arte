import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password.js";

describe("password", () => {
  it("verifica senha correta após hash", async () => {
    const hash = await hashPassword("s3nha-forte");
    await expect(verifyPassword(hash, "s3nha-forte")).resolves.toBe(true);
  });

  it("rejeita senha errada", async () => {
    const hash = await hashPassword("s3nha-forte");
    await expect(verifyPassword(hash, "errada")).resolves.toBe(false);
  });

  it("gera hashes diferentes para a mesma senha (salt distinto)", async () => {
    const a = await hashPassword("igual");
    const b = await hashPassword("igual");
    expect(a).not.toEqual(b);
  });
});
