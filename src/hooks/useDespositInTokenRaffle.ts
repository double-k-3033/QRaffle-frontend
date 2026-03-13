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

export const useDespositInTokenRaffle = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();
  const { handleTransferShareRights } = useTransferShareManagementRights();
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const isRateLimitError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return /rate limit|429|failed to get current tick|tick value is expired|tick value is already in the past|expired|already in the past/i.test(
      message,
    );
  };

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

    // Only check QUBIC balance for transaction fees if transfer is needed
    if (tokenBalanceCheck.needsTransfer) {
      console.log("Transfer needed, checking QUBIC balance for fees...");
      const quBalanceCheck = await BalanceChecks.forTransferShareRights(wallet.publicKey);
      console.log("QUBIC balance check result:", quBalanceCheck);
      
      if (!quBalanceCheck.hasEnoughBalance) {
        console.error("Insufficient QUBIC balance for transfer fees");
        return;
      }
    } else {
      console.log("No transfer needed, skipping QUBIC balance check");
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
      if (isRateLimitError(error)) {
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
      const maxSubmissionAttempts = 4;
      let targetTick = 0;
      let depositResult: Awaited<ReturnType<typeof broadcastTx>> | null = null;
      let initialMemberCount: number | null = null;
      try {
        const activeTokenRaffle = await getActiveTokenRaffle(indexOfTokenRaffles);
        initialMemberCount = activeTokenRaffle?.numberOfMembers ?? null;
      } catch (memberCheckError) {
        console.warn("Failed to fetch initial token raffle member count", memberCheckError);
      }
      for (let attempt = 1; attempt <= maxSubmissionAttempts; attempt++) {
        try {
          console.log("Fetching tick info...");
          const tickInfo = await fetchTickInfo();
          const effectiveTickOffset = Math.max(8, Math.min(settings.tickOffset, 20));
          targetTick = tickInfo.tick + effectiveTickOffset;
          console.log("Target tick:", targetTick);

          console.log("Creating deposit transaction...");
          const depositTx = await depositeInTokenRaffle(wallet.publicKey, indexOfTokenRaffles, targetTick);
          console.log("Deposit tx created:", depositTx);

          console.log("Signing transaction...");
          const signedDepositTx = await getSignedTx(depositTx);
          console.log("Transaction signed");

          console.log("Broadcasting transaction...");
          depositResult = await broadcastTx(signedDepositTx.tx);
          break;
        } catch (error) {
          const retryable = isRateLimitError(error);
          if (!retryable || attempt === maxSubmissionAttempts) {
            throw error;
          }
          const backoffMs = attempt * 1500;
          console.warn(
            `[TokenRaffleDeposit] retrying fresh tx build/sign/broadcast (attempt ${attempt}/${maxSubmissionAttempts}) in ${backoffMs}ms`,
          );
          await sleep(backoffMs);
        }
      }
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

          const balanceAt19 = ownedAssets.find(
            (asset) =>
              asset.issuer === tokenIssuer &&
              asset.assetName.toUpperCase() === tokenName.toUpperCase() &&
              asset.managingContractIndex === 19,
          )?.amount;

          const spentFromIndex19 = typeof balanceAt19 === "number" && balanceAt19 < requiredAmount;

          return membersIncreased || spentFromIndex19;
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
      if (isRateLimitError(error)) {
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
