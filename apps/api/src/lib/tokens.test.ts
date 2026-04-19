import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  decodeAccessTokenUnsafe,
} from "@/lib/tokens.js";

const SECRET = "test-secret-must-be-at-least-32-chars-long-xx";

describe("tokens", () => {
  it("assina e verifica um access token válido", async () => {
    const jwt = await signAccessToken(
      { userId: "user-1", tokenId: "token-1" },
      { secret: SECRET, ttlSeconds: 60 },
    );

    const payload = await verifyAccessToken(jwt, { secret: SECRET });
    expect(payload).toEqual({ userId: "user-1", tokenId: "token-1" });
  });

  it("falha verify com chave errada", async () => {
    const jwt = await signAccessToken(
      { userId: "user-1", tokenId: "token-1" },
      { secret: SECRET, ttlSeconds: 60 },
    );
    await expect(
      verifyAccessToken(jwt, { secret: "outra-chave-com-32-chars-xxxxxxxxxx" }),
    ).rejects.toThrow();
  });

  it("falha verify com token expirado mas decodeUnsafe ainda retorna payload", async () => {
    const jwt = await signAccessToken(
      { userId: "user-1", tokenId: "token-1" },
      { secret: SECRET, ttlSeconds: -10 },
    );

    await expect(verifyAccessToken(jwt, { secret: SECRET })).rejects.toThrow();

    const payload = decodeAccessTokenUnsafe(jwt);
    expect(payload).toEqual({ userId: "user-1", tokenId: "token-1" });
  });

  it("decodeUnsafe joga para token mal formado", () => {
    expect(() => decodeAccessTokenUnsafe("not-a-jwt")).toThrow();
  });
});
