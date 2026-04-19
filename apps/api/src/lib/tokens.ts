import { SignJWT, jwtVerify, decodeJwt, errors as joseErrors } from "jose";

export type AccessTokenPayload = {
  userId: string;
  tokenId: string;
};

const ALG = "HS256";

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: AccessTokenPayload,
  opts: { secret: string; ttlSeconds: number },
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.userId)
    .setJti(payload.tokenId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + opts.ttlSeconds)
    .sign(secretKey(opts.secret));
}

export async function verifyAccessToken(
  jwt: string,
  opts: { secret: string },
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(jwt, secretKey(opts.secret), {
    algorithms: [ALG],
  });
  return extractPayload(payload);
}

export function decodeAccessTokenUnsafe(jwt: string): AccessTokenPayload {
  const payload = decodeJwt(jwt);
  return extractPayload(payload);
}

function extractPayload(payload: Record<string, unknown>): AccessTokenPayload {
  const userId = payload.sub;
  const tokenId = payload.jti;
  if (typeof userId !== "string" || typeof tokenId !== "string") {
    throw new InvalidTokenError("Access token missing sub or jti");
  }
  return { userId, tokenId };
}

export class InvalidTokenError extends Error {
  readonly code = "invalid_token";
  constructor(message = "Invalid token") {
    super(message);
    this.name = "InvalidTokenError";
  }
}

export function isJoseError(err: unknown): boolean {
  return (
    err instanceof joseErrors.JWSSignatureVerificationFailed ||
    err instanceof joseErrors.JWTExpired ||
    err instanceof joseErrors.JWTInvalid ||
    err instanceof joseErrors.JWSInvalid
  );
}
