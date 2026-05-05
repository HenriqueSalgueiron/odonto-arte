import { z } from "zod";

const RESERVED_NAME = "diversos";

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((v) => v.toLowerCase() !== RESERVED_NAME, {
    message: 'Nome reservado para o grupo virtual "Diversos"',
  });

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const categoryListItemSchema = categorySchema.extend({
  serviceCount: z.number().int().nonnegative(),
});

export const createCategoryBodySchema = z.object({
  name: categoryNameSchema,
});

export const updateCategoryBodySchema = createCategoryBodySchema.partial();

export const categoryIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listCategoriesResponseSchema = z.object({
  items: z.array(categoryListItemSchema),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryListItem = z.infer<typeof categoryListItemSchema>;
export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;
export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>;
export type ListCategoriesResponse = z.infer<typeof listCategoriesResponseSchema>;
