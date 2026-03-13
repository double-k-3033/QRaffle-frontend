import { voteInProposal } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";

export const useVoteInProposal = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const handleVote = async (indexOfProposal: number, yes: boolean) => {
    if (!wallet) return;

    // Check balance before proceeding (voting doesn't require fees but ensures wallet is connected)
    const balanceCheck = await BalanceChecks.forVoting(wallet.publicKey);
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    const tickInfo = await fetchTickInfo();

    const targetTick = tickInfo.tick + settings.tickOffset;
    const tx = await voteInProposal(wallet.publicKey, indexOfProposal, yes, targetTick || 0);
    const signedTx = await getSignedTx(tx);
    const result = await broadcastTx(signedTx.tx);

    const taskId = `vote-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    const onSuccess = async () => {
      toast.success(`Vote ${yes ? "YES" : "NO"} submitted successfully`);
    };

    const onFailure = async () => {
      toast.error("Vote submission failed");
    };

    startMonitoring(taskId, {
      checker: async () => false,
      onSuccess,
      onFailure,
      targetTick,
      txHash: result.transactionId,
    });
  };

  return { handleVote };
};
