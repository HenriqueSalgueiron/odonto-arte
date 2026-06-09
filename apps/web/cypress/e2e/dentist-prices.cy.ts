describe("Dentist Prices", () => {
  beforeEach(() => {
    cy.task("db:reset");
    cy.login();
  });

  it("cria dentista, define preço específico e vê o preço efetivo", () => {
    // Seed: 1 serviço de R$ 100 via API
    cy.apiRequest("POST", "/services", {
      name: "Serviço Base",
      description: null,
      price: 100,
      categoryId: null,
    });

    cy.visit("/dentists");
    cy.contains("button", "Novo dentista").click();
    cy.get('input[name="name"]').type("Dr. E2E");
    cy.contains("button", "Criar").click();

    cy.contains("Dr. E2E").should("be.visible");
    cy.get('[aria-label="Preços de Dr. E2E"]').click();

    cy.url().should("match", /\/dentists\/[^/]+\/prices$/);
    cy.contains("Serviço Base").should("be.visible");
    cy.contains("R$ 100,00").should("be.visible");

    // Definir preço específico
    cy.get('[aria-label="Definir preço de Serviço Base"]').click();
    cy.get('input[name="price"]').type("15000");
    cy.contains("button", "Salvar").click();

    // Preço efetivo passa a refletir o específico
    cy.contains("Serviço Base")
      .closest("tr")
      .within(() => {
        cy.contains("R$ 150,00").should("be.visible");
      });
  });
});
