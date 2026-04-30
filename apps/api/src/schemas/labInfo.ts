import { z } from "zod";

export const labInfoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  responsibleTechnician: z.string().nullable(),
  responsibleTechnicianCro: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});

export const updateLabInfoBodySchema = z.object({
  responsibleTechnician: z.string().trim().min(1).max(120),
  responsibleTechnicianCro: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(1).max(30),
  email: z.email().max(254),
});

export type LabInfo = z.infer<typeof labInfoSchema>;
export type UpdateLabInfoBody = z.infer<typeof updateLabInfoBodySchema>;
