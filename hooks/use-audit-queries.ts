import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/services/audit.api";

export function useAuditEventsQuery() {
  return useQuery({
    queryKey: ["audit-events"],
    queryFn: () => auditApi.getAuditEvents(),
  });
}
