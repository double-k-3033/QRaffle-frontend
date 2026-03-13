import { useQuery } from "@tanstack/react-query";
import { getQuRaffleEntryAmountPerUser } from "@/services/sc.service";

export const useQuRaffleEntryAmountPerUser = (user: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quRaffleEntryAmount"],
    queryFn: () => getQuRaffleEntryAmountPerUser(user),
  });

  return {
    entryAmount: data?.entryAmount,
    isLoading,
    isError,
  };
};
