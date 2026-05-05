import { depositeInTokenRaffle } from "@/services/sc.service";
import { getActiveTokenRaffle } from "@/services/sc.service";
import { useAtom } from "jotai";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { settingsAtom } from "@/store/settings";
import { broadcastTx, fetchTickInfo, fetchAssetsOwnership } from "@/services/rpc.service";
import { useTxMonitor } from "@/store/txMonitor";
import { toast } from "sonner";
import { BalanceChecks } from "@/utils/balanceCheck";
import { addParticipation } from "@/utils/participationStorage";
import useTransferShareManagementRights from "@/hooks/useTransferShareManagementRight";
import { isRetryableTickError, submitWithFreshTick } from "@/utils/tickRetry";
import { TOKEN_RAFFLE_DEPOSIT_FEE, TRANSFER_SHARE_MANAGEMENT_RIGHTS_FEE } from "@/utils/constants";

const GARTH_ASSET_NAME = "GARTH";
const GARTH_TOKEN_ISSUER = "PHOENIXCLQOBHDZCHJOCKCPZVTKALQBMXYOEDBUHSDCJRMTUCUBPLSUFNBIE";
const normalizeIdentity = (value: string | null | undefined) => value?.replace(/\0/g, "").trim().toUpperCase() || "";
const normalizeAssetName = (value: string | null | undefined) => value?.replace(/\0/g, "").trim().toUpperCase() || "";

const getCanonicalTokenIdentity = (tokenName: string | null | undefined, tokenIssuer: string | null | undefined) => {
  const normalizedTokenName = normalizeAssetName(tokenName);
  const normalizedTokenIssuer =
    normalizedTokenName === GARTH_ASSET_NAME ? GARTH_TOKEN_ISSUER : normalizeIdentity(tokenIssuer);

  return {
    normalizedTokenName,
    normalizedTokenIssuer,
  };
};

const MIN_TOKEN_RAFFLE_DEPOSIT_TICK_OFFSET = 12;

export const useDespositInTokenRaffle = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();
  const { handleTransferShareRights } = useTransferShareManagementRights();

  const handleDeposit = async (indexOfTokenRaffles: number) => {
    console.log("=== Token Raffle Deposit Started ===");
    console.log("Token raffle index:", indexOfTokenRaffles);
    
    if (!wallet) {
      console.error("No wallet connected");
      return;
    }

    console.log("Wallet connected:", wallet.publicKey);

    // Check token balance and get token information
    console.log("Checking token balance...");
    const tokenBalanceCheck = await BalanceChecks.forTokenRaffle(wallet.publicKey, indexOfTokenRaffles);
    console.log("Token balance check result:", tokenBalanceCheck);
    
    if (!tokenBalanceCheck.hasEnoughBalance) {
      console.error("Insufficient token balance");
      return;
    }

    console.log("Token balance sufficient. needsTransfer:", tokenBalanceCheck.needsTransfer);

    const requiredQubicFeeAmount =
      TOKEN_RAFFLE_DEPOSIT_FEE + (tokenBalanceCheck.needsTransfer ? TRANSFER_SHARE_MANAGEMENT_RIGHTS_FEE : 0);

    console.log("Checking QUBIC balance for raffle tx fees...", {
      requiredQubicFeeAmount,
      needsTransfer: tokenBalanceCheck.needsTransfer,
    });

    const quBalanceCheck = await BalanceChecks.forCustomAmount(
      wallet.publicKey,
      requiredQubicFeeAmount,
      "token raffle tx fee buffer",
    );

    if (!quBalanceCheck.hasEnoughBalance) {
      toast.error(
        `Insufficient QUBIC balance for token raffle fees. Required: ${requiredQubicFeeAmount.toLocaleString()} QUBIC.`,
      );
      console.error("Insufficient QUBIC balance for token raffle fees", {
        requiredQubicFeeAmount,
        currentBalance: quBalanceCheck.currentBalance,
      });
      return;
    }

    try {
      const tickInfo = await fetchTickInfo();
      const currentEpoch = tickInfo.epoch;
      console.log("Current epoch:", currentEpoch);

      // If tokens need to be transferred from index 1 to index 19, do it first
      if (tokenBalanceCheck.needsTransfer && tokenBalanceCheck.transferAmount) {
        console.log("[TokenJoin][Stage 1/3] Transfer required before deposit");
        console.log("Initiating token transfer...");
        console.log("Transfer parameters:", {
          assetName: tokenBalanceCheck.tokenName,
          assetIssuer: tokenBalanceCheck.tokenIssuer,
          amount: tokenBalanceCheck.transferAmount,
        });
        toast.info(`Transferring ${tokenBalanceCheck.transferAmount} ${tokenBalanceCheck.tokenName} to QRaffle contract...`);
        
        await handleTransferShareRights({
          assetName: tokenBalanceCheck.tokenName!,
          assetIssuer: tokenBalanceCheck.tokenIssuer!,
          contractIndex: 19,
          amount: tokenBalanceCheck.requiredAmount,
          isFromQX: true,
          onTransferConfirmed: async ({ txHash, targetTick }) => {
            console.log("[TokenJoin][Stage 1/3] Transfer confirmed", { txHash, targetTick });
            toast.info("Stage 1/3: Token transfer confirmed. Submitting raffle deposit...");
          },
          fallback: async () => {
            console.log("Transfer successful, participating in raffle...");
            // After successful transfer, participate in the raffle
            await participateInRaffle(
              indexOfTokenRaffles,
              currentEpoch,
              tokenBalanceCheck.tokenName || "",
              tokenBalanceCheck.tokenIssuer || "",
              tokenBalanceCheck.requiredAmount,
            );
          },
        });
      } else {
        // Tokens already at index 19, participate directly
        console.log("[TokenJoin][Stage 1/3] No transfer needed, tokens already at index 19");
        toast.info("Stage 1/3: Token balance ready. Submitting raffle deposit...");
        console.log("Tokens at index 19, participating directly...");
        await participateInRaffle(
          indexOfTokenRaffles,
          currentEpoch,
          tokenBalanceCheck.tokenName || "",
          tokenBalanceCheck.tokenIssuer || "",
          tokenBalanceCheck.requiredAmount,
        );
      }
    } catch (error) {
      if (isRetryableTickError(error)) {
        toast.error("Submission failed due to RPC/tick timing. Please wait a few seconds and try again.");
      } else {
        toast.error("Failed to participate in token raffle");
      }
      console.error("Error in token raffle participation:", error);
    }
  };

  const participateInRaffle = async (
    indexOfTokenRaffles: number,
    currentEpoch: number,
    tokenName: string,
    tokenIssuer: string,
    requiredAmount: number,
  ) => {
    console.log("=== participateInRaffle called ===");
    console.log("Index:", indexOfTokenRaffles, "Epoch:", currentEpoch);
    
    if (!wallet) {
      console.error("No wallet in participateInRaffle");
      return;
    }

    try {
      let targetTick = 0;
      let depositResult: Awaited<ReturnType<typeof broadcastTx>> | null = null;
      let initialMemberCount: number | null = null;
      let initialBalanceAt19: number | null = null;
      const { normalizedTokenIssuer, normalizedTokenName } = getCanonicalTokenIdentity(tokenName, tokenIssuer);
      try {
        const [activeTokenRaffle, ownedAssets] = await Promise.all([
          getActiveTokenRaffle(indexOfTokenRaffles),
          fetchAssetsOwnership(wallet.publicKey),
        ]);
        initialMemberCount = activeTokenRaffle?.numberOfMembers ?? null;

        const baselineAssetAt19 = ownedAssets.find(
          (asset) =>
            normalizeIdentity(asset.issuer) === normalizedTokenIssuer &&
            normalizeAssetName(asset.assetName) === normalizedTokenName &&
            asset.managingContractIndex === 19,
        );
        initialBalanceAt19 = typeof baselineAssetAt19?.amount === "number" ? baselineAssetAt19.amount : 0;
      } catch (memberCheckError) {
        console.warn("Failed to fetch initial token raffle checker baseline", memberCheckError);
      }

      const submission = await submitWithFreshTick({
        tickOffset: settings.tickOffset,
        fetchTickInfo,
        retryContext: "TokenRaffleDeposit",
        minTickOffset: MIN_TOKEN_RAFFLE_DEPOSIT_TICK_OFFSET,
        execute: async ({ targetTick: nextTargetTick }) => {
          console.log("Target tick:", nextTargetTick);
          console.log("Creating deposit transaction...");
          const depositTx = await depositeInTokenRaffle(wallet.publicKey, indexOfTokenRaffles, nextTargetTick || 0);
          console.log("Deposit tx created:", depositTx);

          console.log("Signing transaction...");
          const signedDepositTx = await getSignedTx(depositTx);
          console.log("Transaction signed");

          console.log("Broadcasting transaction...");
          return await broadcastTx(signedDepositTx.tx);
        },
      });

      targetTick = submission.targetTick;
      depositResult = submission.result;

      if (!depositResult || targetTick <= 0) {
        throw new Error("Token raffle deposit transaction submission failed");
      }

      console.log("Transaction broadcast result:", depositResult);
      console.log("[TokenJoin][Stage 2/3] Deposit broadcasted", {
        txHash: depositResult.transactionId,
        targetTick,
      });
      toast.info(`Stage 2/3: Deposit broadcasted (${depositResult.transactionId.slice(0, 10)}...)`);

      // Monitor the transaction
      const depositTaskId = `deposit-token-raffle-${wallet.publicKey}-${targetTick}-${Date.now()}`;

      const onDepositSuccess = async () => {
        console.log("Token raffle deposit SUCCESS");
        console.log("[TokenJoin][Stage 3/3] Deposit confirmed");
        // Save participation info to localStorage
        addParticipation(wallet.publicKey, {
          type: "token",
          epoch: currentEpoch,
          index: indexOfTokenRaffles,
        });
        toast.success("Stage 3/3: Token raffle participation confirmed");
      };

      const onDepositFailure = async () => {
        console.log("Token raffle deposit FAILED");
        console.log("[TokenJoin][Stage 3/3] Deposit failed");
        toast.error("Stage 3/3: Token raffle participation failed");
      };

      const depositChecker = async () => {
        if (!wallet) return false;
        try {
          const [activeTokenRaffle, ownedAssets] = await Promise.all([
            getActiveTokenRaffle(indexOfTokenRaffles),
            fetchAssetsOwnership(wallet.publicKey),
          ]);

          const membersIncreased =
            initialMemberCount !== null &&
            !!activeTokenRaffle &&
            activeTokenRaffle.numberOfMembers > initialMemberCount;

          const matchingAssetAt19 = ownedAssets.find(
            (asset) =>
              normalizeIdentity(asset.issuer) === normalizedTokenIssuer &&
              normalizeAssetName(asset.assetName) === normalizedTokenName &&
              asset.managingContractIndex === 19,
          );
          const balanceAt19 = typeof matchingAssetAt19?.amount === "number" ? matchingAssetAt19.amount : 0;

          const spentFromIndex19ByDelta =
            typeof initialBalanceAt19 === "number" && initialBalanceAt19 - balanceAt19 >= requiredAmount;

          const spentFromIndex19ByThreshold = balanceAt19 < requiredAmount;

          return membersIncreased || spentFromIndex19ByDelta || spentFromIndex19ByThreshold;
        } catch (checkerError) {
          console.warn("Token raffle deposit checker failed", checkerError);
          return false;
        }
      };

      console.log("Starting transaction monitoring...");
      // Start monitoring for token raffle deposit
      // Using v2 strategy to avoid CORS issues with tick events endpoint
      startMonitoring(
        depositTaskId,
        {
          checker: depositChecker,
          onSuccess: onDepositSuccess,
          onFailure: onDepositFailure,
          targetTick,
          txHash: depositResult.transactionId,
          canRecoverFromMoneyFlewFalse: true,
          timeoutMs: 45000,
          fastTrack: true,
          participationMetadata: {
            publicKey: wallet.publicKey,
            participation: {
              type: "token",
              epoch: currentEpoch,
              index: indexOfTokenRaffles,
            },
          },
        },
        "v2",
      );
      console.log("Transaction monitoring started with v2 strategy");
    } catch (error) {
      if (isRetryableTickError(error)) {
        toast.error("Deposit failed due to RPC/tick timing. Please wait a few seconds and try again.");
      } else {
        toast.error("Failed to create or broadcast transaction");
      }
      console.error("Error in participateInRaffle:", error);
      throw error;
    }
  };

  return { handleDeposit };
};
