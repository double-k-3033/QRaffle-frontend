import { useQuery } from "@tanstack/react-query";
import { getActiveProposal, getAnalytics } from "@/services/sc.service";

export const useProposals = () => {
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
    data: proposals,
    isLoading: isLoadingProposals,
    isError: isErrorProposals,
    error: errorProposals,
    refetch: refetchProposals,
  } = useQuery({
    queryKey: ["proposals", analytics?.numberOfProposals],
    queryFn: async () => {
      if (!analytics?.numberOfProposals) return [];
      const requests = [];
      for (let i = 0; i < analytics.numberOfProposals; i++) {
        requests.push(
          getActiveProposal(i).then((proposal) => ({
            id: i,
            ...proposal,
          })),
        );
      }
      const results = await Promise.all(requests);
      return results;
    },
    enabled: !!analytics,
  });

  return {
    proposals, // each item: { id: proposalId, value: proposal }
    isLoading: isLoadingAnalytics || isLoadingProposals,
    isError: isErrorAnalytics || isErrorProposals,
    error: errorAnalytics || errorProposals,
    refetch: refetchProposals,
  };
};
