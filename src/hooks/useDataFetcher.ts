import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { tickInfoAtom, latestStatsAtom } from "@/store/rpc";
import { balancesAtom } from "@/store/balances";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { fetchBalance, fetchLatestStats, fetchTickInfo } from "@/services/rpc.service";

const useDataFetcher = () => {
  const [, setBalance] = useAtom(balancesAtom);
  const [tickInfo, setTickInfo] = useAtom(tickInfoAtom);
  const epoch = useRef<number>(tickInfo?.epoch);
  const [, setLatestStats] = useAtom(latestStatsAtom);
  const { wallet } = useQubicConnect();

  useEffect(() => {
    try {
      fetchTickInfo().then((data) => {
        if (data && data?.tick) {
          setTickInfo(data);
          epoch.current = data?.epoch;
        }
      });

      fetchLatestStats().then((data) => {
        setLatestStats(data);
      });

      if (wallet?.publicKey) {
        fetchBalance(wallet.publicKey).then((data) => {
          setBalance([data]);
        });
      }
    } catch (error) {
      console.error("Error fetching tick info:", error);
    }
  }, [wallet, setBalance, setTickInfo, setLatestStats]);
};

export default useDataFetcher;
