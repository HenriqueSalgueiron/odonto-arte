import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const logoutBodySchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
