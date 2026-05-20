import { z } from "zod";

export const exportTemplateSchema = z.object({
  id: z.uuid(),
  categoryOrder: z.array(z.uuid()),
  observations: z.array(z.string()),
  updatedAt: z.iso.datetime(),
});

export const updateExportTemplateBodySchema = z.object({
  categoryOrder: z.array(z.uuid()),
  observations: z.array(z.string().max(500)),
});

export type ExportTemplate = z.infer<typeof exportTemplateSchema>;
export type UpdateExportTemplateBody = z.infer<
  typeof updateExportTemplateBodySchema
>;
