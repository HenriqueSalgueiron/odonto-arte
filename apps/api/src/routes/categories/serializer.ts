import type { Category as PrismaCategory } from "@prisma/client";
import type { Category } from "@/schemas/categories.js";

type PrismaCategoryWithCount = PrismaCategory & {
  _count?: { services: number };
};

export function serializeCategory(
  category: PrismaCategoryWithCount,
  fallbackServiceCount = 0,
): Category {
  return {
    id: category.id,
    name: category.name,
    serviceCount: category._count?.services ?? fallbackServiceCount,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
