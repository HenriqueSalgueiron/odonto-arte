import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GetAuthMeQueryResponse } from "@/generated";

export type AuthUser = GetAuthMeQueryResponse;

export type AuthStatus =
  | "idle"
  | "bootstrapping"
  | "authenticated"
  | "unauthenticated";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
};

type AuthActions = {
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
};

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  status: "idle",
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      setUser: (user) =>
        set({
          user,
          status: user ? "authenticated" : "unauthenticated",
        }),
      setStatus: (status) => set({ status }),
      clear: () => set({ ...initialState, status: "unauthenticated" }),
    }),
    {
      name: "odontoarte.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

export function getAuthTokens() {
  const { accessToken, refreshToken } = useAuthStore.getState();
  return { accessToken, refreshToken };
}
