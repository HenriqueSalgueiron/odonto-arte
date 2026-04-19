import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createInMemoryTokenStore } from "@/lib/tokenStore.js";

describe("InMemoryTokenStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("set + get retorna o valor dentro do TTL", async () => {
    const store = createInMemoryTokenStore();
    await store.set("k1", "v1", 60);
    expect(await store.get("k1")).toBe("v1");
  });

  it("get retorna null após TTL expirar", async () => {
    const store = createInMemoryTokenStore();
    await store.set("k1", "v1", 1);
    vi.advanceTimersByTime(1500);
    expect(await store.get("k1")).toBeNull();
  });

  it("del remove chave", async () => {
    const store = createInMemoryTokenStore();
    await store.set("k1", "v1", 60);
    await store.del("k1");
    expect(await store.get("k1")).toBeNull();
  });

  it("delByPrefix remove todas com o prefixo", async () => {
    const store = createInMemoryTokenStore();
    await store.set("refresh:u1:t1", "v1", 60);
    await store.set("refresh:u1:t2", "v2", 60);
    await store.set("refresh:u2:t1", "v3", 60);

    await store.delByPrefix("refresh:u1:");

    expect(await store.get("refresh:u1:t1")).toBeNull();
    expect(await store.get("refresh:u1:t2")).toBeNull();
    expect(await store.get("refresh:u2:t1")).toBe("v3");
  });
});
