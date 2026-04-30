import type { LabInfo as PrismaLabInfo } from "@prisma/client";
import type { LabInfo } from "@/schemas/labInfo.js";

export function serializeLabInfo(labInfo: PrismaLabInfo): LabInfo {
  return {
    id: labInfo.id,
    name: labInfo.name,
    responsibleTechnician: labInfo.responsibleTechnician,
    responsibleTechnicianCro: labInfo.responsibleTechnicianCro,
    phone: labInfo.phone,
    email: labInfo.email,
    updatedAt: labInfo.updatedAt.toISOString(),
  };
}
