import { describe, it, expect } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { PriceListDocument } from "@/lib/pdf/PriceListDocument";
import type {
  LabInfoForPdf,
  PriceListDocumentProps,
} from "@/lib/pdf/types";

const LAB_INFO: LabInfoForPdf = {
  id: "id",
  name: "OdontoArte",
  responsibleTechnician: "Antonio Richardson",
  responsibleTechnicianCro: "9166",
  phone: "(12) 98819-4011",
  email: "odontoarte@hotmail.com",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function walk(node: ReactNode, visitor: (el: ReactElement) => void): void {
  if (node == null || typeof node === "boolean") return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visitor);
    return;
  }
  if (typeof node === "string" || typeof node === "number") return;
  if (!isValidElement(node)) return;

  visitor(node);

  if (typeof node.type === "function") {
    try {
      const rendered = (node.type as (props: unknown) => ReactNode)(
        node.props,
      );
      walk(rendered, visitor);
      return;
    } catch {
      // primitivos do @react-pdf não são chamáveis fora do reconciler — cai aqui
    }
  }

  const props = node.props as { children?: ReactNode };
  if (props.children !== undefined) walk(props.children, visitor);
}

function collectTextContent(
  element: ReactElement<PriceListDocumentProps>,
): string {
  const parts: string[] = [];
  walk(element, (el) => {
    const props = el.props as { children?: ReactNode };
    if (typeof props.children === "string") parts.push(props.children);
  });
  return parts.join(" | ");
}

function countFixedViews(element: ReactElement<PriceListDocumentProps>): number {
  let count = 0;
  walk(element, (el) => {
    const props = el.props as { fixed?: boolean };
    if (props.fixed === true) count += 1;
  });
  return count;
}

describe("PriceListDocument", () => {
  it("renderiza estrutura básica com lab + uma categoria + uma row", () => {
    const element = (
      <PriceListDocument
        labInfo={LAB_INFO}
        sections={[
          {
            categoryName: "Metalo Cerâmica",
            rows: [{ id: "s1", name: "Aplicação de porcelana", price: 120 }],
          },
        ]}
        observations={[]}
      />
    );
    const text = collectTextContent(element);
    expect(text).toContain("OdontoArte");
    expect(text).toContain("Metalo Cerâmica");
    expect(text).toContain("Aplicação de porcelana");
    expect(text).toContain("R$");
    expect(text).toContain("120,00");
  });

  it("inclui múltiplas seções na ordem recebida", () => {
    const element = (
      <PriceListDocument
        labInfo={LAB_INFO}
        sections={[
          { categoryName: "Alfa", rows: [{ id: "1", name: "x", price: 10 }] },
          { categoryName: "Beta", rows: [{ id: "2", name: "y", price: 20 }] },
        ]}
        observations={[]}
      />
    );
    const text = collectTextContent(element);
    const alfa = text.indexOf("Alfa");
    const beta = text.indexOf("Beta");
    expect(alfa).toBeGreaterThan(-1);
    expect(beta).toBeGreaterThan(alfa);
  });

  it("renderiza seção de observações quando há itens", () => {
    const element = (
      <PriceListDocument
        labInfo={LAB_INFO}
        sections={[]}
        observations={["Dentes cobrados a parte.", "Taxa de emergência."]}
      />
    );
    const text = collectTextContent(element);
    expect(text).toContain("Observações");
    expect(text).toContain("Dentes cobrados a parte.");
    expect(text).toContain("Taxa de emergência.");
  });

  it("não renderiza header de observações quando array está vazio", () => {
    const element = (
      <PriceListDocument
        labInfo={LAB_INFO}
        sections={[
          { categoryName: "Alfa", rows: [{ id: "1", name: "x", price: 10 }] },
        ]}
        observations={[]}
      />
    );
    const text = collectTextContent(element);
    expect(text).not.toContain("Observações");
  });

  it("o header do laboratório usa atributo fixed (repete em todas as páginas)", () => {
    const element = (
      <PriceListDocument
        labInfo={LAB_INFO}
        sections={[]}
        observations={[]}
      />
    );
    expect(countFixedViews(element)).toBeGreaterThan(0);
  });
});
