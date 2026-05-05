import { registerInSystem, SC_INDEX } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";
import useTransferShareManagementRights from "@/hooks/useTransferShareManagementRight";
import { QRAFFLE_QXMR_REGISTER_AMOUNT } from "@/utils/constants";
import { isRetryableTickError, submitWithFreshTick } from "@/utils/tickRetry";

export const useRegisterInSystem = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const { handleTransferShareRights, checkTransferShareRights } = useTransferShareManagementRights();

  const submitRegisterTx = async (withQXMR: boolean) => {
    if (!wallet) return;

    let targetTick = 0;
    let result: Awaited<ReturnType<typeof broadcastTx>>;

    try {
      const submission = await submitWithFreshTick({
        tickOffset: settings.tickOffset,
        fetchTickInfo,
        retryContext: "RegisterInSystem",
        execute: async ({ targetTick: nextTargetTick }) => {
          const tx = await registerInSystem(wallet.publicKey, nextTargetTick || 0, withQXMR);
          const signedTx = await getSignedTx(tx);
          return await broadcastTx(signedTx.tx);
        },
      });

      targetTick = submission.targetTick;
      result = submission.result;
    } catch (error) {
      if (isRetryableTickError(error)) {
        toast.error("Registration failed due to RPC/tick timing. Please wait a few seconds and try again.");
      } else {
        toast.error("Register in system failure");
      }
      console.error("Error registering in system:", error);
      return;
    }

    const taskId = `reg-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    const onSuccess = async () => {
      toast.success("Register in system successfully");
    };

    const onFailure = async () => {
      toast.error("Register in system failure");
    };

    startMonitoring(taskId, {
      checker: async () => false,
      onSuccess,
      onFailure,
      targetTick,
      txHash: result.transactionId,
    });
  };

  const handleRegister = async (options?: {
    withQXMR?: boolean;
    qxmrIssuer?: string; // required if withQXMR
    qxmrAssetName?: string; // required if withQXMR (human-readable name string)
  }) => {
    if (!wallet) return;
    const withQXMR = options?.withQXMR === true;

    // Check balance before proceeding (QUBIC needed either for amount or fees)
    const balanceCheck = withQXMR
      ? await BalanceChecks.forTransferShareRights(wallet.publicKey)
      : await BalanceChecks.forRegistration(wallet.publicKey);
    if (!balanceCheck.hasEnoughBalance) {
      return;
    }

    // If using QXMR, transfer share management rights first, then register with flag
    if (withQXMR) {
      if (!options?.qxmrIssuer || !options?.qxmrAssetName) {
        toast.error("Missing QXMR issuer or asset name");
        return;
      }

      const check = await checkTransferShareRights(options.qxmrAssetName, SC_INDEX, QRAFFLE_QXMR_REGISTER_AMOUNT);
      if (!check) {
        await handleTransferShareRights({
          assetIssuer: options.qxmrIssuer,
          assetName: options.qxmrAssetName,
          amount: QRAFFLE_QXMR_REGISTER_AMOUNT,
          contractIndex: SC_INDEX,
          isFromQX: true,
          fallback: async () => {
            await submitRegisterTx(true);
          },
        });
      } else {
        await submitRegisterTx(true);
      }
    } else {
      await submitRegisterTx(false);
    }
  };

  return { handleRegister };
};
