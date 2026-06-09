describe("Auth", () => {
  beforeEach(() => {
    cy.task("db:reset");
  });

  it("faz login com credenciais válidas e vai pra home", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type(Cypress.env("adminEmail") as string);
    cy.get('input[name="password"]').type(
      Cypress.env("adminPassword") as string,
    );
    cy.contains("button", "Entrar").click();
    cy.url().should("not.include", "/login");
    cy.contains(/bem-vindo/i).should("be.visible");
  });

  it("mostra alerta com credenciais inválidas e permanece em /login", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("naoexiste@odontoarte.local");
    cy.get('input[name="password"]').type("senha-errada");
    cy.contains("button", "Entrar").click();
    cy.contains(/email ou senha inválidos/i).should("be.visible");
    cy.url().should("include", "/login");
  });
});
