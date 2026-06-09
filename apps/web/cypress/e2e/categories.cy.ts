describe("Categories", () => {
  beforeEach(() => {
    cy.task("db:reset");
    cy.login();
  });

  it("cria categoria inline ao criar serviço e mostra o chip na listagem", () => {
    cy.visit("/services");

    cy.contains("button", "Novo serviço").click();
    cy.get('input[name="name"]').type("Serviço com Cat");
    cy.get('input[name="priceInput"]').type("10000");

    // Abrir menu de categoria
    cy.get('input[aria-label="Categoria"]').click();

    // Clicar em "Nova categoria"
    cy.contains("Nova categoria").click();

    // Digitar nome e confirmar (ícone Check com aria-label "Criar categoria")
    cy.get('input[aria-label="Nova categoria"]').type("Metalo Cerâmica");
    cy.get('[aria-label="Criar categoria"]').click();

    // O campo do form agora mostra a categoria selecionada
    cy.get('input[aria-label="Categoria"]').should(
      "have.value",
      "Metalo Cerâmica",
    );

    cy.contains("button", "Criar").click();

    // Chip da categoria aparece na linha
    cy.contains("Serviço com Cat").should("be.visible");
    cy.contains("Metalo Cerâmica").should("be.visible");
  });
});
