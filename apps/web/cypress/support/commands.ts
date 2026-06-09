/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login programático via POST /auth/login.
       * Cacheia a sessão entre testes via cy.session. Por padrão usa
       * Cypress.env('adminEmail') e Cypress.env('adminPassword') (seedados
       * pelo orchestrator a partir do .env da api).
       */
      login(email?: string, password?: string): Chainable<void>;

      /**
       * Request autenticado pra API do backend. Faz login programático
       * (token cacheado em memória pelo spec inteiro) e adiciona o
       * Authorization header. Usado pra semear dados antes do teste visitar a UI.
       */
      apiRequest<T = unknown>(
        method: "GET" | "POST" | "PUT" | "DELETE",
        path: string,
        body?: unknown,
      ): Chainable<Cypress.Response<T>>;
    }
  }
}

const AUTH_STORAGE_KEY = "odontoarte.auth";

let cachedApiToken: string | null = null;

function getApiToken(): Cypress.Chainable<string> {
  if (cachedApiToken) {
    return cy.wrap(cachedApiToken, { log: false });
  }
  const apiUrl = Cypress.env("apiUrl") as string;
  const e = Cypress.env("adminEmail") as string;
  const p = Cypress.env("adminPassword") as string;
  return cy
    .request({
      method: "POST",
      url: `${apiUrl}/auth/login`,
      body: { email: e, password: p },
      log: false,
    })
    .then((res) => {
      const body = res.body as { accessToken: string };
      cachedApiToken = body.accessToken;
      return cachedApiToken;
    });
}

Cypress.Commands.add("login", (email?: string, password?: string) => {
  const e = email ?? (Cypress.env("adminEmail") as string);
  const p = password ?? (Cypress.env("adminPassword") as string);
  const apiUrl = Cypress.env("apiUrl") as string;

  cy.session(["login", e], () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/auth/login`,
      body: { email: e, password: p },
    }).then((response) => {
      const body = response.body as {
        accessToken: string;
        refreshToken: string;
      };
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          state: {
            accessToken: body.accessToken,
            refreshToken: body.refreshToken,
          },
          version: 0,
        }),
      );
    });
  });
});

Cypress.Commands.add(
  "apiRequest",
  (method, path, body) => {
    const apiUrl = Cypress.env("apiUrl") as string;
    return getApiToken().then((token) =>
      cy.request({
        method,
        url: `${apiUrl}${path}`,
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
    );
  },
);

export {};
