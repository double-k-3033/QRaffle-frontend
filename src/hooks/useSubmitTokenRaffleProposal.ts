import { submitProposal } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";

export const useSubmitTokenRaffleProposal = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const handleSubmitProposal = async (issuer: string, assetName: number, entryAmount: number) => {
    if (!wallet) return;

    // Check balance before proceeding (proposal submission may require fees)
    const balanceCheck = await BalanceChecks.forVoting(wallet.publicKey);
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    const tickInfo = await fetchTickInfo();

    const targetTick = tickInfo.tick + settings.tickOffset;
    const tx = await submitProposal(wallet.publicKey, issuer, assetName, entryAmount, targetTick || 0);
    const signedTx = await getSignedTx(tx);
    const result = await broadcastTx(signedTx.tx);

    const taskId = `submit-proposal-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    const onSuccess = async () => {
      toast.success("Token raffle proposal submitted successfully");
    };

    const onFailure = async () => {
      toast.error("Token raffle proposal submission failed");
    };

    startMonitoring(taskId, {
      checker: async () => false,
      onSuccess,
      onFailure,
      targetTick,
      txHash: result.transactionId,
    });
  };

  return { handleSubmitProposal };
};
