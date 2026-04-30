import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/mocks/server";
import { API_URL, makeFakeLabInfo, resetFakeLabInfoDb } from "@/mocks/handlers";
import { createQueryClient } from "@/lib/queryClient";
import { isLabInfoConfigured, useLabInfo } from "@/hooks/useLabInfo";

function wrapper() {
  const qc = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("isLabInfoConfigured", () => {
  it("retorna false quando data está indefinido", () => {
    expect(isLabInfoConfigured(undefined)).toBe(false);
  });

  it("retorna false quando algum campo editável é null", () => {
    expect(
      isLabInfoConfigured(
        makeFakeLabInfo({ phone: null }),
      ),
    ).toBe(false);
  });

  it("retorna false quando algum campo é só espaços em branco", () => {
    expect(
      isLabInfoConfigured(makeFakeLabInfo({ email: "   " })),
    ).toBe(false);
  });

  it("retorna true quando todos os campos estão preenchidos", () => {
    expect(
      isLabInfoConfigured(
        makeFakeLabInfo({
          responsibleTechnician: "Maria",
          responsibleTechnicianCro: "CRO 1",
          phone: "21999998888",
          email: "lab@odontoarte.local",
        }),
      ),
    ).toBe(true);
  });
});

describe("useLabInfo", () => {
  it("expõe isConfigured=false enquanto carrega", () => {
    resetFakeLabInfoDb(makeFakeLabInfo());
    const { result } = renderHook(() => useLabInfo(), { wrapper: wrapper() });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isConfigured).toBe(false);
  });

  it("expõe isConfigured=false quando o backend retorna registro parcial", async () => {
    resetFakeLabInfoDb(makeFakeLabInfo({ phone: null }));

    const { result } = renderHook(() => useLabInfo(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isConfigured).toBe(false);
  });

  it("expõe isConfigured=true quando o registro está completo", async () => {
    resetFakeLabInfoDb(
      makeFakeLabInfo({
        responsibleTechnician: "Maria",
        responsibleTechnicianCro: "CRO 1",
        phone: "21999998888",
        email: "lab@odontoarte.local",
      }),
    );

    const { result } = renderHook(() => useLabInfo(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isConfigured).toBe(true);
  });

  it("propaga erro do backend", async () => {
    server.use(
      http.get(`${API_URL}/lab-info/`, () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useLabInfo(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isConfigured).toBe(false);
  });
});
