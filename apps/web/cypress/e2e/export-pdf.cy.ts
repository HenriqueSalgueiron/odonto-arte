describe("Export PDF", () => {
  beforeEach(() => {
    cy.task("db:reset");
    cy.login();
  });

  it("exporta PDF da tabela geral, salvando o template se houver mudanças", () => {
    // Lab info completo (sem isso o dialog mostra warning e bloqueia)
    cy.apiRequest("PUT", "/lab-info", {
      responsibleTechnician: "Maria Salgueiro",
      responsibleTechnicianCro: "CRO-RJ 123",
      phone: "21999998888",
      email: "lab@odontoarte.local",
    });

    // 1 categoria + 1 serviço
    cy.apiRequest<{ id: string; name: string }>("POST", "/categories", {
      name: "Metalo Cerâmica",
    }).then((res) => {
      cy.apiRequest("POST", "/services", {
        name: "Aplicação de porcelana",
        description: null,
        price: 12000,
        categoryId: res.body.id,
      });
    });

    cy.intercept("PUT", "**/export-template/").as("putTemplate");

    cy.visit("/services");
    cy.contains("button", "Exportar PDF").click();

    // Dialog abriu, categoria persistida aparece
    cy.contains("Ordem das categorias").should("be.visible");
    cy.contains("Metalo Cerâmica").should("be.visible");
    cy.contains("Diversos").should("be.visible");
    cy.contains("Sempre no final").should("be.visible");

    // Adicionar observação
    cy.contains("button", "Adicionar observação").click();
    cy.get('input[aria-label="Observação 1"]').type("Dentes cobrados a parte.");

    // Exportar (escopado pro dialog pra não pegar o "Exportar PDF" da página)
    cy.get('[role="dialog"]').contains("button", "Exportar").click();

    // PUT foi disparado porque houve mudança
    cy.wait("@putTemplate").its("response.statusCode").should("eq", 200);

    // Dialog fechou
    cy.contains("Ordem das categorias").should("not.exist");
  });

  it("bloqueia exportação quando lab info está incompleto", () => {
    // beforeEach já truncou lab_info. O GET cria a linha singleton vazia
    // (todos os campos null) → useLabInfo expõe isConfigured=false.
    cy.visit("/services");
    cy.contains("button", "Exportar PDF").click();

    cy.contains(/configure as informações do laboratório/i).should("be.visible");
    cy.get('[role="dialog"]')
      .contains("button", "Exportar")
      .should("not.exist");
  });
});
