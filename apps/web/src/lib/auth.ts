import { postAuthLogout } from "@/generated/clients/authClient/postAuthLogout";
import { useAuthStore, getAuthTokens } from "@/stores/authStore";

export async function logoutSession(): Promise<void> {
  const { accessToken, refreshToken } = getAuthTokens();
  if (accessToken && refreshToken) {
    try {
      await postAuthLogout({ accessToken, refreshToken });
    } catch {
      // logout é best-effort: backend é idempotente, e mesmo se a request
      // falhar (rede, 5xx) queremos limpar o estado local de qualquer forma.
    }
  }
  useAuthStore.getState().clear();
}
