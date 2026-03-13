import { useQuery } from "@tanstack/react-query";
import { getAnalytics, getRegisters } from "@/services/sc.service";

const PAGE_SIZE = 20;

export const useAllRegisters = () => {
  const {
    isLoading: isLoadingAnalytics,
    isError: isErrorAnalytics,
    error: errorAnalytics,
    data: analytics,
  } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(),
  });

  const {
    isLoading: isLoadingRegisters,
    isError: isErrorRegisters,
    error: errorRegisters,
    data: allRegisters,
    refetch: refetchRegisters,
  } = useQuery({
    queryKey: ["registers", analytics?.numberOfRegisters],
    queryFn: async () => {
      if (!analytics?.numberOfRegisters) return [];
      const total = analytics.numberOfRegisters;
      const requests = [];
      for (let offset = 0; offset < total; offset += PAGE_SIZE) {
        const limit = Math.min(PAGE_SIZE, total - offset);
        requests.push(getRegisters(offset, limit));
      }
      const results = await Promise.all(requests);
      const allRegistersFlat = results
        .map((r) => (Array.isArray(r.registers) ? r.registers : []))
        .flat()
        .slice(0, total);
      return allRegistersFlat;
    },
    enabled: !!analytics,
  });

  return {
    analytics,
    registers: allRegisters,
    isLoading: isLoadingAnalytics || isLoadingRegisters,
    isError: isErrorAnalytics || isErrorRegisters,
    error: errorAnalytics || errorRegisters,
    refetch: refetchRegisters,
  };
};
