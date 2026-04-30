import { z } from "zod";

export const dentistPriceRowSchema = z.object({
  serviceId: z.uuid(),
  serviceName: z.string(),
  tablePrice: z.number().nonnegative().multipleOf(0.01),
  specificPrice: z.number().nonnegative().multipleOf(0.01).nullable(),
  effectivePrice: z.number().nonnegative().multipleOf(0.01),
});

export const listDentistPricesParamsSchema = z.object({
  dentistId: z.uuid(),
});

export const listDentistPricesResponseSchema = z.object({
  items: z.array(dentistPriceRowSchema),
});

export const setDentistPriceParamsSchema = z.object({
  dentistId: z.uuid(),
  serviceId: z.uuid(),
});

export const setDentistPriceBodySchema = z.object({
  price: z.number().nonnegative().multipleOf(0.01),
});

export const setDentistPriceResponseSchema = z.object({
  id: z.uuid(),
  dentistId: z.uuid(),
  serviceId: z.uuid(),
  price: z.number().nonnegative().multipleOf(0.01),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type DentistPriceRow = z.infer<typeof dentistPriceRowSchema>;
export type ListDentistPricesParams = z.infer<typeof listDentistPricesParamsSchema>;
export type ListDentistPricesResponse = z.infer<typeof listDentistPricesResponseSchema>;
export type SetDentistPriceParams = z.infer<typeof setDentistPriceParamsSchema>;
export type SetDentistPriceBody = z.infer<typeof setDentistPriceBodySchema>;
export type SetDentistPriceResponse = z.infer<typeof setDentistPriceResponseSchema>;
