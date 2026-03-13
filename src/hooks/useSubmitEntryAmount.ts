import { submitEntryAmount } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";

export const useSubmitEntryAmount = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const handleSubmitEntryAmount = async (amount: number) => {
    if (!wallet) return;

    // Check balance before proceeding
    const balanceCheck = await BalanceChecks.forCustomAmount(wallet.publicKey, 0, "entry amount submission");
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    const tickInfo = await fetchTickInfo();

    const targetTick = tickInfo.tick + settings.tickOffset;
    const tx = await submitEntryAmount(wallet.publicKey, amount, targetTick || 0);
    const signedTx = await getSignedTx(tx);
    const result = await broadcastTx(signedTx.tx);

    const taskId = `submit-entry-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    const onSuccess = async () => {
      toast.success("Entry amount submitted successfully");
    };

    const onFailure = async () => {
      toast.error("Entry amount submission failed");
    };

    startMonitoring(taskId, {
      checker: async () => false,
      onSuccess,
      onFailure,
      targetTick,
      txHash: result.transactionId,
    });
  };

  return { handleSubmitEntryAmount };
};
