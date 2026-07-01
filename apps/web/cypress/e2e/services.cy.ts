describe("Services CRUD", () => {
  beforeEach(() => {
    cy.task("db:reset");
    cy.login();
  });

  it("cria, edita e desativa um serviço pelo fluxo da UI", () => {
    cy.visit("/services");

    // Criar
    cy.contains("button", "Novo serviço").click();
    cy.get('input[name="name"]').type("Serviço E2E");
    cy.get('input[name="priceInput"]').type("12500");
    cy.contains("button", "Criar").click();

    cy.contains("Serviço E2E").should("be.visible");
    cy.contains("R$ 125,00").should("be.visible");

    // Editar
    cy.get('[aria-label="Mais ações para Serviço E2E"]').click();
    cy.get('[role="menuitem"]').contains("Editar").click();
    cy.get('input[name="name"]').clear().type("Serviço E2E Editado");
    cy.contains("button", "Salvar").click();

    cy.contains("Serviço E2E Editado").should("be.visible");
    cy.contains(/^Serviço E2E$/).should("not.exist");

    // Desativar
    cy.get('[aria-label="Mais ações para Serviço E2E Editado"]').click();
    cy.get('[role="menuitem"]').contains("Desativar").click();
    cy.get('[role="dialog"]').contains("button", "Desativar").click();

    // Some da lista (filtro padrão exclui inativos)
    cy.contains("Serviço E2E Editado").should("not.exist");

    // Toggle "Mostrar inativos" → reaparece com chip Inativo
    cy.contains("label", "Mostrar inativos").click();
    cy.contains("Serviço E2E Editado").should("be.visible");
    cy.contains("Inativo").should("be.visible");
  });
});
