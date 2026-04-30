import type {
  Service as PrismaService,
  Category as PrismaCategory,
} from "@prisma/client";
import type { Service } from "@/schemas/services.js";

type PrismaServiceWithCategory = PrismaService & {
  category?: Pick<PrismaCategory, "id" | "name"> | null;
};

export function serializeService(service: PrismaServiceWithCategory): Service {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    active: service.active,
    category: service.category
      ? { id: service.category.id, name: service.category.name }
      : null,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
