import type { Category as PrismaCategory } from "@prisma/client";
import type { Category, CategoryListItem } from "@/schemas/categories.js";

type PrismaCategoryWithCount = PrismaCategory & {
  _count: { services: number };
};

export function serializeCategory(category: PrismaCategory): Category {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function serializeCategoryListItem(
  category: PrismaCategoryWithCount,
): CategoryListItem {
  return {
    ...serializeCategory(category),
    serviceCount: category._count.services,
  };
}
