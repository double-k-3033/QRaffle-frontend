import { logoutInSystem } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";

export const useLogoutInSystem = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const handleLogout = async () => {
    if (!wallet) return;

    // Check balance before proceeding
    const balanceCheck = await BalanceChecks.forLogout(wallet.publicKey);
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    const tickInfo = await fetchTickInfo();
    const targetTick = tickInfo.tick + settings.tickOffset;

    // Standard QUBIC logout
    const tx = await logoutInSystem(wallet.publicKey, targetTick || 0);
    const signedTx = await getSignedTx(tx);
    const result = await broadcastTx(signedTx.tx);

    const taskId = `logout-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    const onSuccess = async () => {
      toast.success("Logout from system successfully");
    };

    const onFailure = async () => {
      toast.error("Logout from system failure");
    };

    startMonitoring(taskId, {
      checker: async () => false,
      onSuccess,
      onFailure,
      targetTick,
      txHash: result.transactionId,
    });
  };

  return { handleLogout };
};
