import { useQuery } from "@tanstack/react-query";
import { getQuRaffleParticipants, getTokenRaffleParticipants } from "@/services/participants.service";
import type { RaffleParticipant } from "@/services/participants.service";

interface UseRaffleParticipantsOptions {
  epoch: number;
  isTokenRaffle?: boolean;
  tokenRaffleIndex?: number;
  enabled?: boolean;
}

export const useRaffleParticipants = ({ epoch, isTokenRaffle = false, tokenRaffleIndex, enabled = true }: UseRaffleParticipantsOptions) => {
  const { data: participants, isLoading, error } = useQuery({
    queryKey: ["raffleParticipants", epoch, isTokenRaffle, tokenRaffleIndex],
    queryFn: async (): Promise<RaffleParticipant[]> => {
      if (isTokenRaffle && typeof tokenRaffleIndex === "number") {
        return await getTokenRaffleParticipants(epoch, tokenRaffleIndex);
      } else {
        return await getQuRaffleParticipants(epoch);
      }
    },
    enabled: enabled && epoch > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const totalParticipants = participants?.length || 0;
  const totalEntries = participants?.reduce((sum, p) => sum + p.entryCount, 0) || 0;

  return {
    participants: participants || [],
    totalParticipants,
    totalEntries,
    isLoading,
    error,
  };
};
