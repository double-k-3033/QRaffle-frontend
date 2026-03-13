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

export const useRegisterInSystem = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const { handleTransferShareRights, checkTransferShareRights } = useTransferShareManagementRights();

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
            const tickInfo = await fetchTickInfo();
            const targetTick = tickInfo.tick + settings.tickOffset;
            const tx = await registerInSystem(wallet.publicKey, targetTick || 0, true);
            const signedTx = await getSignedTx(tx);
            const result = await broadcastTx(signedTx.tx);

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
          },
        });
      } else {
        const tickInfo = await fetchTickInfo();
        const targetTick = tickInfo.tick + settings.tickOffset;
        const tx = await registerInSystem(wallet.publicKey, targetTick || 0, true);
        const signedTx = await getSignedTx(tx);
        const result = await broadcastTx(signedTx.tx);

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
      }
    } else {
      const tickInfo = await fetchTickInfo();
      const targetTick = tickInfo.tick + settings.tickOffset;
      const tx = await registerInSystem(wallet.publicKey, targetTick || 0, false);
      const signedTx = await getSignedTx(tx);
      const result = await broadcastTx(signedTx.tx);

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
    }
  };

  return { handleRegister };
};
