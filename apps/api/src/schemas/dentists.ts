import { z } from "zod";

export const dentistSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  cro: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createDentistBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  cro: z.string().trim().max(20).nullish(),
  phone: z.string().trim().max(30).nullish(),
  email: z.email().max(254).nullish(),
  notes: z.string().trim().max(2000).nullish(),
});

export const updateDentistBodySchema = createDentistBodySchema.partial().extend({
  active: z.boolean().optional(),
});

export const dentistIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listDentistsQuerySchema = z.object({
  includeInactive: z.stringbool().optional(),
});

export const listDentistsResponseSchema = z.object({
  items: z.array(dentistSchema),
});

export type Dentist = z.infer<typeof dentistSchema>;
export type CreateDentistBody = z.infer<typeof createDentistBodySchema>;
export type UpdateDentistBody = z.infer<typeof updateDentistBodySchema>;
export type DentistIdParams = z.infer<typeof dentistIdParamsSchema>;
export type ListDentistsQuery = z.infer<typeof listDentistsQuerySchema>;
export type ListDentistsResponse = z.infer<typeof listDentistsResponseSchema>;
