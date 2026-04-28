import { z } from "zod";

export const serviceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nonnegative().multipleOf(0.01),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createServiceBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullish(),
  price: z.number().nonnegative().multipleOf(0.01),
});

export const updateServiceBodySchema = createServiceBodySchema.partial().extend({
  active: z.boolean().optional(),
});

export const serviceIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listServicesQuerySchema = z.object({
  includeInactive: z.stringbool().optional(),
});

export const listServicesResponseSchema = z.object({
  items: z.array(serviceSchema),
});

export type Service = z.infer<typeof serviceSchema>;
export type CreateServiceBody = z.infer<typeof createServiceBodySchema>;
export type UpdateServiceBody = z.infer<typeof updateServiceBodySchema>;
export type ServiceIdParams = z.infer<typeof serviceIdParamsSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
export type ListServicesResponse = z.infer<typeof listServicesResponseSchema>;
