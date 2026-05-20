import type { ExportTemplate as PrismaExportTemplate } from "@prisma/client";
import type { ExportTemplate } from "@/schemas/exportTemplate.js";

export function serializeExportTemplate(
  template: PrismaExportTemplate,
): ExportTemplate {
  return {
    id: template.id,
    categoryOrder: template.categoryOrder,
    observations: template.observations,
    updatedAt: template.updatedAt.toISOString(),
  };
}
