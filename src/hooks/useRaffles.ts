import { useQuery } from "@tanstack/react-query";
import {
  getActiveTokenRaffle,
  getAnalytics,
  getEndedQuRaffle,
  getEndedTokenRaffle,
  getEpochRaffleIndexes,
} from "@/services/sc.service";
import { fetchTickInfo } from "@/services/rpc.service";

type StandardRaffleResult = {
  epoch: number;
  epochWinner: string;
  receivedAmount: number;
  entryAmount: number;
  numberOfMembers: number;
  winnerIndex: number;
  numberOfDaoMembers?: number;
  type: "standard";
};

type TokenRaffleResult = {
  epoch: number;
  tokenIssuer: string;
  tokenName: string;
  entryAmount: number;
  numberOfMembers: number;
  type: "token";
  tokenRaffleIndex: number;
  epochWinner?: string;
  winnerIndex?: number;
};

type RaffleResult = StandardRaffleResult | TokenRaffleResult;

export const useRaffles = (start: number, end: number, isTokenRaffles: boolean) => {
  // For Qu raffle, start, end are epoch numbers.
  // Each epoch has one Qu raffle and possibly several Token raffles.

  const {
    data: raffles,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["raffles", start, end, isTokenRaffles],
    queryFn: async () => {
      const results: RaffleResult[] = [];
      const tickInfo = await fetchTickInfo();
      if (!tickInfo || typeof tickInfo.epoch !== "number") {
        throw new Error("Invalid tick info");
      }
      let analytics: Awaited<ReturnType<typeof getAnalytics>> | undefined;
      try {
        analytics = await getAnalytics();
      } catch (error) {
        console.warn("useRaffles: failed to load analytics", error);
      }

      for (let epoch = start; epoch <= end; epoch++) {
        // Each epoch has a Qu raffle (always 1)
        if (!isTokenRaffles) {
          try {
            const quRaffle = await getEndedQuRaffle(epoch);
            if (quRaffle) {
              results.push({ epoch, ...quRaffle, type: "standard" });
              continue;
            }
          } catch (error) {
            console.warn(`useRaffles: failed to load standard raffle for epoch ${epoch}`, error);
          }

          const isCurrentEpoch = epoch === tickInfo.epoch;
          const fallbackEntryAmount = analytics?.currentQuRaffleAmount;
          const fallbackNumberOfMembers = analytics?.numberOfQuRaffleMembers;
          const hasFallbackAnalytics =
            typeof fallbackEntryAmount === "number" &&
            Number.isFinite(fallbackEntryAmount) &&
            typeof fallbackNumberOfMembers === "number" &&
            Number.isFinite(fallbackNumberOfMembers);

          if (isCurrentEpoch && hasFallbackAnalytics) {
            results.push({
              epoch,
              epochWinner: "",
              receivedAmount: 0,
              entryAmount: fallbackEntryAmount,
              numberOfMembers: fallbackNumberOfMembers,
              winnerIndex: 0,
              numberOfDaoMembers: 0,
              type: "standard",
            });
          }
        }

        // Each epoch may have several Token raffles
        if (isTokenRaffles) {
          if (tickInfo.epoch > epoch) {
            try {
              const epochIndexesRes = await getEpochRaffleIndexes(epoch);
              if (
                epochIndexesRes &&
                typeof epochIndexesRes.startIndex === "number" &&
                typeof epochIndexesRes.endIndex === "number"
              ) {
                for (let index = epochIndexesRes.startIndex; index <= epochIndexesRes.endIndex; index++) {
                  try {
                    const tokenRaffle = await getEndedTokenRaffle(index);
                    // Check tokenRaffle belongs to this epoch before insert
                    if (tokenRaffle && tokenRaffle.epoch === epoch) {
                      results.push({ ...tokenRaffle, type: "token", tokenRaffleIndex: index });
                    }
                  } catch (error) {
                    console.warn(`useRaffles: failed to load ended token raffle index ${index}`, error);
                  }
                }
              }
            } catch (error) {
              console.warn(`useRaffles: failed to load token raffle indexes for epoch ${epoch}`, error);
            }
          } else {
            // if epoch is current epoch
            const activeTokenRaffleNumber = Math.max(0, Number(analytics?.numberOfActiveTokenRaffle ?? 0));
            for (let index = 0; index < activeTokenRaffleNumber; index++) {
              try {
                const tokenRaffle = await getActiveTokenRaffle(index);
                if (tokenRaffle) {
                  results.push({ epoch: tickInfo.epoch, ...tokenRaffle, type: "token", tokenRaffleIndex: index });
                }
              } catch (error) {
                console.warn(`useRaffles: failed to load active token raffle index ${index}`, error);
              }
            }
          }
        }
      }

      return results;
    },
    enabled: Number.isFinite(start) && Number.isFinite(end) && start <= end,
    retry: 2,
  });

  return {
    raffles: raffles || [],
    isLoading,
    isError,
    error,
    refetch,
  };
};
