import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

// jsdom não implementa ResizeObserver. Componentes que observam tamanho de
// elementos (ex: StickyActionsTableContainer) precisam dessa fake.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/authStore";
import {
  resetFakeDentistsDb,
  resetFakeExportTemplateDb,
  resetFakeLabInfoDb,
  resetFakeServicesDb,
  resetFakeSpecificPricesDb,
} from "@/mocks/handlers";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    status: "idle",
  });
  resetFakeServicesDb();
  resetFakeDentistsDb();
  resetFakeSpecificPricesDb();
  resetFakeLabInfoDb();
  resetFakeExportTemplateDb();
});
