import { useAtom } from "jotai";
import { balancesAtom } from "@/store/balances";
import { useEffect } from "react";
import { fetchBalance } from "@/services/rpc.service";
import { useQuery } from "@tanstack/react-query";

export const useBalance = (publicId: string) => {
  const [_, setBalances] = useAtom(balancesAtom);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["balance", publicId],
    queryFn: () => fetchBalance(publicId),
    enabled: !!publicId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setBalances([data]);
    }
  }, [data, setBalances]);

  return {
    balances: data ? [data] : [],
    isLoading,
    isError,
    refetch,
  };
};
