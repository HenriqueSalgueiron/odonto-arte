import type { Dentist as PrismaDentist } from "@prisma/client";
import type { Dentist } from "@/schemas/dentists.js";

export function serializeDentist(dentist: PrismaDentist): Dentist {
  return {
    id: dentist.id,
    name: dentist.name,
    cro: dentist.cro,
    phone: dentist.phone,
    email: dentist.email,
    notes: dentist.notes,
    active: dentist.active,
    createdAt: dentist.createdAt.toISOString(),
    updatedAt: dentist.updatedAt.toISOString(),
  };
}
