import { DIVERSOS_NAME } from "@/lib/pdf/theme";
import type {
  CategoryForExport,
  PriceSection,
  ServiceForExport,
} from "@/lib/pdf/types";

export function buildSectionsByCategory(
  services: ServiceForExport[],
  categories: CategoryForExport[],
  categoryOrder: string[],
): PriceSection[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const servicesByCategoryId = new Map<string | null, ServiceForExport[]>();
  for (const service of services) {
    const key = service.categoryId ?? null;
    const bucket = servicesByCategoryId.get(key) ?? [];
    bucket.push(service);
    servicesByCategoryId.set(key, bucket);
  }

  const usedIds = new Set<string>();
  const orderedIds: string[] = [];

  for (const id of categoryOrder) {
    if (categoryById.has(id) && !usedIds.has(id)) {
      orderedIds.push(id);
      usedIds.add(id);
    }
  }

  const remaining = categories
    .filter((c) => !usedIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  for (const c of remaining) orderedIds.push(c.id);

  const sections: PriceSection[] = [];
  for (const id of orderedIds) {
    const category = categoryById.get(id);
    if (!category) continue;
    const rows = servicesByCategoryId.get(id) ?? [];
    if (rows.length === 0) continue;
    sections.push({
      categoryName: category.name,
      rows: rows
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((s) => ({ id: s.id, name: s.name, price: s.price })),
    });
  }

  const diversos = servicesByCategoryId.get(null) ?? [];
  if (diversos.length > 0) {
    sections.push({
      categoryName: DIVERSOS_NAME,
      rows: diversos
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((s) => ({ id: s.id, name: s.name, price: s.price })),
    });
  }

  return sections;
}
