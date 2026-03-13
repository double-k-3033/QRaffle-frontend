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

const useTransferShareManagementRights = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const isRateLimitError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return /rate limit|429|failed to get current tick|tick value is expired|tick value is already in the past|expired|already in the past/i.test(
      message,
    );
  };

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
      const maxSubmissionAttempts = 4;
      let targetTick = 0;
      let res: Awaited<ReturnType<typeof broadcastTx>> | null = null;
      for (let attempt = 1; attempt <= maxSubmissionAttempts; attempt++) {
        try {
          const tickInfo = await fetchTickInfo();
          const effectiveTickOffset = Math.max(8, Math.min(settings.tickOffset, 20));
          targetTick = tickInfo.tick + effectiveTickOffset;
          const transferShareTx = isFromQX
            ? await transferShareManagementRightsFromQX(
                wallet.publicKey,
                {
                  issuer: assetIssuer,
                  assetName: assetNameConvert(assetName) as number,
                },
                requiredTransferAmount,
                contractIndex,
                targetTick,
              )
            : await transferShareManagementRightsFromQRaffle(
                wallet.publicKey,
                {
                  issuer: assetIssuer,
                  assetName: assetNameConvert(assetName) as number,
                },
                amount,
                contractIndex,
                targetTick,
              );
          const signedTransferShareTx = await getSignedTx(transferShareTx);
          res = await broadcastTx(signedTransferShareTx.tx);
          break;
        } catch (error) {
          const retryable = isRateLimitError(error);
          if (!retryable || attempt === maxSubmissionAttempts) {
            throw error;
          }
          const backoffMs = attempt * 1500;
          console.warn(
            `[TransferShareRights] retrying fresh tx build/sign/broadcast (attempt ${attempt}/${maxSubmissionAttempts}) in ${backoffMs}ms`,
          );
          await sleep(backoffMs);
        }
      }
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
        },
        "v2",
      );
    } catch (error) {
      if (isRateLimitError(error)) {
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
