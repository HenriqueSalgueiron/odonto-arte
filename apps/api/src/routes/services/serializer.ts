import type { Service as PrismaService } from "@prisma/client";
import type { Service } from "@/schemas/services.js";

export function serializeService(service: PrismaService): Service {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    active: service.active,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
