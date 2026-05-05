import { logoutInSystem } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";
import { isRetryableTickError, submitWithFreshTick } from "@/utils/tickRetry";

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

    let targetTick = 0;
    let result: Awaited<ReturnType<typeof broadcastTx>>;

    try {
      const submission = await submitWithFreshTick({
        tickOffset: settings.tickOffset,
        fetchTickInfo,
        retryContext: "LogoutInSystem",
        execute: async ({ targetTick: nextTargetTick }) => {
          const tx = await logoutInSystem(wallet.publicKey, nextTargetTick || 0);
          const signedTx = await getSignedTx(tx);
          return await broadcastTx(signedTx.tx);
        },
      });

      targetTick = submission.targetTick;
      result = submission.result;
    } catch (error) {
      if (isRetryableTickError(error)) {
        toast.error("Logout failed due to RPC/tick timing. Please wait a few seconds and try again.");
      } else {
        toast.error("Logout from system failure");
      }
      console.error("Error logging out from system:", error);
      return;
    }

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
