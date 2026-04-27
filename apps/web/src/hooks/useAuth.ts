import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAuthMe,
  getAuthMeQueryKey,
  useGetAuthMe,
  usePostAuthLogin,
} from "@/generated";
import { useAuthStore } from "@/stores/authStore";
import { logoutSession } from "@/lib/auth";

export function useAuth() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);

  const meQuery = useGetAuthMe({
    query: {
      enabled: Boolean(accessToken),
    },
  });

  useEffect(() => {
    if (!accessToken) {
      if (status !== "unauthenticated") setStatus("unauthenticated");
      return;
    }
    if (meQuery.isLoading && !user) {
      if (status !== "bootstrapping") setStatus("bootstrapping");
      return;
    }
    if (meQuery.data && meQuery.data !== user) {
      setUser(meQuery.data);
    }
  }, [
    accessToken,
    user,
    status,
    meQuery.data,
    meQuery.isLoading,
    setUser,
    setStatus,
  ]);

  const loginMutation = usePostAuthLogin();

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const tokens = await loginMutation.mutateAsync({ data: input });
      setTokens(tokens);
      const me = await queryClient.fetchQuery({
        queryKey: getAuthMeQueryKey(),
        queryFn: () => getAuthMe(),
      });
      setUser(me);
      return me;
    },
    [loginMutation, queryClient, setTokens, setUser],
  );

  const logout = useCallback(async () => {
    await logoutSession();
    queryClient.removeQueries({ queryKey: getAuthMeQueryKey() });
  }, [queryClient]);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isBootstrapping: status === "bootstrapping",
    login,
    logout,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
  };
}
