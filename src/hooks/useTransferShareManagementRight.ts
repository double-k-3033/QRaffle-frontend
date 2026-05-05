import { useAtom } from "jotai";

import { assetNameConvert } from "@/utils";
import { broadcastTx, fetchAssetsBalance } from "@/services/rpc.service";
import { settingsAtom } from "@/store/settings";
import { fetchTickInfo } from "@/services/rpc.service";
import { transferShareManagementRightsFromQRaffle, transferShareManagementRightsFromQX } from "@/services/sc.service";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { useTxMonitor } from "@/store/txMonitor";
import { BalanceChecks } from "@/utils/balanceCheck";
import { toast } from "sonner";
import { isRetryableTickError, submitWithFreshTick } from "@/utils/tickRetry";

const useTransferShareManagementRights = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const checkTransferShareRights = async (
    assetName: string,
    contractIndex: number,
    expectedAmount: number,
  ): Promise<boolean> => {
    if (!wallet) {
      console.error("Please connect your wallet");
      return false;
    }
    const targetContractCurrentAmount = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);

    return targetContractCurrentAmount >= expectedAmount;
  };

  const handleTransferShareRights = async ({
    assetName,
    assetIssuer,
    contractIndex,
    amount,
    fallback,
    isFromQX = true,
    onTransferConfirmed,
  }: {
    assetName: string;
    assetIssuer: string;
    contractIndex: number;
    amount: number;
    fallback?: () => Promise<void>;
    isFromQX?: boolean;
    onTransferConfirmed?: (params: { txHash: string; targetTick: number }) => Promise<void> | void;
  }) => {
    if (!wallet) {
      console.error("Please connect your wallet");
      return;
    }

    // Check balance before proceeding
    const balanceCheck = await BalanceChecks.forTransferShareRights(wallet.publicKey);
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    try {
      const targetContractOriginAmount = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);
      const requiredTransferAmount = isFromQX ? Math.max(0, amount - targetContractOriginAmount) : amount;

      if (requiredTransferAmount <= 0) {
        if (fallback) {
          await fallback();
        }
        return;
      }
      let targetTick = 0;
      let res: Awaited<ReturnType<typeof broadcastTx>> | null = null;

      const submission = await submitWithFreshTick({
        tickOffset: settings.tickOffset,
        fetchTickInfo,
        retryContext: "TransferShareRights",
        execute: async ({ targetTick: nextTargetTick }) => {
          const transferShareTx = isFromQX
            ? await transferShareManagementRightsFromQX(
                wallet.publicKey,
                {
                  issuer: assetIssuer,
                  assetName: assetNameConvert(assetName) as number,
                },
                requiredTransferAmount,
                contractIndex,
                nextTargetTick || 0,
              )
            : await transferShareManagementRightsFromQRaffle(
                wallet.publicKey,
                {
                  issuer: assetIssuer,
                  assetName: assetNameConvert(assetName) as number,
                },
                amount,
                contractIndex,
                nextTargetTick || 0,
              );

          const signedTransferShareTx = await getSignedTx(transferShareTx);
          return await broadcastTx(signedTransferShareTx.tx);
        },
      });

      targetTick = submission.targetTick;
      res = submission.result;

      if (!res || targetTick <= 0) {
        throw new Error("Transfer share rights transaction submission failed");
      }

      const taskId = `transfer-share-rights-${targetTick}-${Date.now()}`;
      const checker = async () => {
        if (!wallet) return false;
        const expectedAmount = isFromQX ? amount : targetContractOriginAmount + amount;
        return await checkTransferShareRights(assetName, isFromQX ? contractIndex : 1, expectedAmount);
      };

      const onSuccess = async () => {
        toast.success("Transfer share rights successfully");
        await onTransferConfirmed?.({ txHash: res.transactionId, targetTick });
        if (fallback) {
          await fallback();
        }
      };

      const onFailure = async () => {
        toast.error("Transfer share rights failed");
      };

      // Use v2 monitoring to properly detect success/failure via moneyFlew field
      startMonitoring(
        taskId,
        {
          checker,
          onSuccess,
          onFailure,
          targetTick,
          txHash: res.transactionId,
          canRecoverFromMoneyFlewFalse: true,
          timeoutMs: 45000,
          fastTrack: true,
        },
        "v2",
      );
    } catch (error) {
      if (isRetryableTickError(error)) {
        toast.error("Transfer failed due to RPC/tick timing. Please wait a few seconds and try again.");
      } else {
        toast.error("Error transferring share rights");
      }
      console.error("Error transferring share rights", error);
      return;
    }
  };

  return { handleTransferShareRights, checkTransferShareRights };
};

export default useTransferShareManagementRights;
