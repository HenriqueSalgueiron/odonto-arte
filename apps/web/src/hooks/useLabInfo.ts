import { useGetLabInfo } from "@/generated";
import type { GetLabInfoQueryResponse } from "@/generated";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isLabInfoConfigured(
  data: GetLabInfoQueryResponse | undefined,
): boolean {
  if (!data) return false;
  return (
    isNonEmptyString(data.name) &&
    isNonEmptyString(data.responsibleTechnician) &&
    isNonEmptyString(data.responsibleTechnicianCro) &&
    isNonEmptyString(data.phone) &&
    isNonEmptyString(data.email)
  );
}

export function useLabInfo() {
  const query = useGetLabInfo();
  return {
    ...query,
    isConfigured: isLabInfoConfigured(query.data),
  };
}
