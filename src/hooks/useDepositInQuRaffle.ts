import { depositeInQuRaffle } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";
import { addParticipation } from "@/utils/participationStorage";

export const useDepositInQuRaffle = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const handleDeposit = async (amount: number) => {
    if (!wallet) return;

    // Check balance before proceeding
    const balanceCheck = await BalanceChecks.forCustomAmount(wallet.publicKey, amount, "QuRaffle deposit");
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    const tickInfo = await fetchTickInfo();
    const effectiveTickOffset = Math.max(1, Math.min(settings.tickOffset, 5));
    const targetTick = tickInfo.tick + effectiveTickOffset;
    const currentEpoch = tickInfo.epoch;
    const tx = await depositeInQuRaffle(wallet.publicKey, amount, targetTick || 0);
    const signedTx = await getSignedTx(tx);
    const result = await broadcastTx(signedTx.tx);

    const taskId = `deposit-quraffle-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    const onSuccess = async () => {
      // Save participation info to localStorage
      addParticipation(wallet.publicKey, {
        type: "qu",
        epoch: currentEpoch,
      });
      toast.success("Deposit in QuRaffle successful");
    };

    const onFailure = async () => {
      toast.error("Deposit in QuRaffle failed");
    };

    startMonitoring(
      taskId,
      {
        checker: async () => false,
        onSuccess,
        onFailure,
        targetTick,
        txHash: result.transactionId,
        participationMetadata: {
          publicKey: wallet.publicKey,
          participation: {
            type: "qu",
            epoch: currentEpoch,
          },
        },
      },
      "v3",
    );
  };

  return { handleDeposit };
};
