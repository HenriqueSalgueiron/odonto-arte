import { beforeEach, describe, expect, it } from "vitest";
import { getAuthTokens, useAuthStore } from "@/stores/authStore";

const STORAGE_KEY = "odontoarte.auth";

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    status: "idle",
  });
});

describe("authStore", () => {
  it("setTokens grava no estado e persiste apenas tokens em localStorage", () => {
    useAuthStore.getState().setTokens({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });

    expect(useAuthStore.getState().accessToken).toBe("access-1");
    expect(useAuthStore.getState().refreshToken).toBe("refresh-1");

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.state).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
  });

  it("setUser não persiste o usuário em localStorage", () => {
    useAuthStore.getState().setTokens({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
    useAuthStore.getState().setUser({
      id: "u1",
      email: "a@b.com",
      name: "Ana",
    });

    expect(useAuthStore.getState().user?.name).toBe("Ana");
    expect(useAuthStore.getState().status).toBe("authenticated");

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.state.user).toBeUndefined();
  });

  it("setUser(null) marca status como unauthenticated", () => {
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("clear zera tudo e marca status como unauthenticated", () => {
    useAuthStore.getState().setTokens({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
    useAuthStore.getState().setUser({
      id: "u1",
      email: "a@b.com",
      name: "Ana",
    });

    useAuthStore.getState().clear();

    const s = useAuthStore.getState();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
    expect(s.user).toBeNull();
    expect(s.status).toBe("unauthenticated");
  });

  it("getAuthTokens devolve os tokens atuais sem causar subscribe", () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
    });
    expect(getAuthTokens()).toEqual({
      accessToken: "a",
      refreshToken: "r",
    });
  });
});
