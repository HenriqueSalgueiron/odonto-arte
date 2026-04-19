import { randomBytes, timingSafeEqual } from "node:crypto";

const REFRESH_TOKEN_BYTES = 64;

export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function refreshTokenKey(userId: string, tokenId: string): string {
  return `refresh:${userId}:${tokenId}`;
}

export function refreshTokenUserPrefix(userId: string): string {
  return `refresh:${userId}:`;
}
