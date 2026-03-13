import { toast } from "sonner";
import { fetchBalance, fetchAssetsOwnership } from "@/services/rpc.service";
import { getActiveTokenRaffle } from "@/services/sc.service";
import { QRAFFLE_REGISTER_AMOUNT, TRANSFER_SHARE_MANAGEMENT_RIGHTS_FEE } from "@/utils/constants";

export interface BalanceCheckResult {
  hasEnoughBalance: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
}

export interface TokenBalanceCheckResult extends BalanceCheckResult {
  tokenName?: string;
  tokenIssuer?: string;
  needsApproval?: boolean;
  needsTransfer?: boolean;
  transferAmount?: number;
}

/**
 * Centralized balance checking utility
 * Checks if user has sufficient balance for various operations
 */
export const checkBalance = async (
  publicKey: string,
  requiredAmount: number,
  operationName: string,
): Promise<BalanceCheckResult> => {
  try {
    const balanceData = await fetchBalance(publicKey);
    const currentBalance = balanceData.balance || 0;
    const hasEnoughBalance = currentBalance >= requiredAmount;
    const shortfall = Math.max(0, requiredAmount - currentBalance);

    if (!hasEnoughBalance) {
      toast.error(
        `Insufficient balance for ${operationName}. Required: ${requiredAmount.toLocaleString()} QUBIC, Available: ${currentBalance.toLocaleString()} QUBIC`,
      );
    }

    return {
      hasEnoughBalance,
      currentBalance,
      requiredAmount,
      shortfall,
    };
  } catch (error) {
    console.error("Error checking balance:", error);
    toast.error("Failed to check balance. Please try again.");
    return {
      hasEnoughBalance: false,
      currentBalance: 0,
      requiredAmount,
      shortfall: requiredAmount,
    };
  }
};

/**
 * Predefined balance checks for common operations
 */
export const BalanceChecks = {
  /**
   * Check balance for system registration
   */
  async forRegistration(publicKey: string): Promise<BalanceCheckResult> {
    return checkBalance(publicKey, QRAFFLE_REGISTER_AMOUNT, "system registration");
  },

  /**
   * Check balance for system logout
   */
  async forLogout(publicKey: string): Promise<BalanceCheckResult> {
    return checkBalance(publicKey, 0, "system logout");
  },

  /**
   * Check balance for transfer share management rights
   */
  async forTransferShareRights(publicKey: string): Promise<BalanceCheckResult> {
    return checkBalance(publicKey, TRANSFER_SHARE_MANAGEMENT_RIGHTS_FEE, "transfer share management rights");
  },

  /**
   * Check balance for custom amount operations
   */
  async forCustomAmount(publicKey: string, amount: number, operationName: string): Promise<BalanceCheckResult> {
    return checkBalance(publicKey, amount, operationName);
  },

  /**
   * Check balance for voting (no fee required, but ensures wallet is connected)
   */
  async forVoting(publicKey: string): Promise<BalanceCheckResult> {
    return checkBalance(publicKey, 0, "voting");
  },

  /**
   * Check token balance and approval for token raffle participation
   * First checks managingContractIndex 19 (QRaffle), then index 1 (QX) if needed
   */
  async forTokenRaffle(publicKey: string, tokenRaffleIndex: number): Promise<TokenBalanceCheckResult> {
    try {
      // Get token raffle information
      const tokenRaffleInfo = await getActiveTokenRaffle(tokenRaffleIndex);
      if (!tokenRaffleInfo) {
        toast.error("Token raffle not found");
        return {
          hasEnoughBalance: false,
          currentBalance: 0,
          requiredAmount: 0,
          shortfall: 0,
        };
      }

      // Get user's token balance
      const userAssets = await fetchAssetsOwnership(publicKey);
      const requiredAmount = tokenRaffleInfo.entryAmount;

      console.log("All user assets:", userAssets);
      console.log("Looking for token:", {
        tokenName: tokenRaffleInfo.tokenName,
        tokenIssuer: tokenRaffleInfo.tokenIssuer,
        requiredAmount,
      });

      // First check managingContractIndex 19 (QRaffle contract)
      const tokenAssetAt19 = userAssets.find(
        (asset) =>
          asset.issuer === tokenRaffleInfo.tokenIssuer &&
          asset.assetName.toUpperCase() === tokenRaffleInfo.tokenName.toUpperCase() &&
          asset.managingContractIndex === 19,
      );

      const balanceAt19 = tokenAssetAt19?.amount || 0;
      console.log("Balance at index 19:", balanceAt19);

      // If enough balance at index 19, no transfer needed
      if (balanceAt19 >= requiredAmount) {
        console.log(`Sufficient balance at managingContractIndex 19: ${balanceAt19}`);
        return {
          hasEnoughBalance: true,
          currentBalance: balanceAt19,
          requiredAmount,
          shortfall: 0,
          // Use actual asset name from wallet (correct case) instead of raffle info
          tokenName: tokenAssetAt19?.assetName || tokenRaffleInfo.tokenName,
          tokenIssuer: tokenRaffleInfo.tokenIssuer,
          needsApproval: false,
          needsTransfer: false,
        };
      }

      // Check managingContractIndex 1 (QX)
      const tokenAssetAt1 = userAssets.find(
        (asset) =>
          asset.issuer === tokenRaffleInfo.tokenIssuer &&
          asset.assetName.toUpperCase() === tokenRaffleInfo.tokenName.toUpperCase() &&
          asset.managingContractIndex === 1,
      );

      const balanceAt1 = tokenAssetAt1?.amount || 0;
      console.log("Balance at index 1:", balanceAt1);
      
      const totalBalance = balanceAt19 + balanceAt1;

      console.log({ balanceAt19, balanceAt1, totalBalance, requiredAmount, tokenRaffleInfo });
      
      // Check if token exists at any other managing contract index
      const allMatchingTokens = userAssets.filter(
        (asset) =>
          asset.issuer === tokenRaffleInfo.tokenIssuer &&
          asset.assetName.toUpperCase() === tokenRaffleInfo.tokenName.toUpperCase()
      );
      console.log("All matching tokens across all indices:", allMatchingTokens);

      const hasEnoughBalance = totalBalance >= requiredAmount;
      const shortfall = Math.max(0, requiredAmount - totalBalance);

      if (!hasEnoughBalance) {
        toast.error(
          `Insufficient ${tokenRaffleInfo.tokenName} balance for token raffle. Required: ${requiredAmount.toLocaleString()}, Available: ${totalBalance.toLocaleString()}`,
        );
        return {
          hasEnoughBalance: false,
          currentBalance: totalBalance,
          requiredAmount,
          shortfall,
          tokenName: tokenRaffleInfo.tokenName,
          tokenIssuer: tokenRaffleInfo.tokenIssuer,
        };
      }

      // Need to transfer from index 1 to index 19
      const transferAmount = requiredAmount - balanceAt19;
      console.log(`Need to transfer ${transferAmount} from index 1 to index 19`);

      return {
        hasEnoughBalance: true,
        currentBalance: totalBalance,
        requiredAmount,
        shortfall: 0,
        // Use actual asset name from wallet (correct case) instead of raffle info
        tokenName: tokenAssetAt1?.assetName || tokenRaffleInfo.tokenName,
        tokenIssuer: tokenRaffleInfo.tokenIssuer,
        needsApproval: true,
        needsTransfer: true,
        transferAmount,
      };
    } catch (error) {
      console.error("Error checking token raffle balance:", error);
      toast.error("Failed to check token balance. Please try again.");
      return {
        hasEnoughBalance: false,
        currentBalance: 0,
        requiredAmount: 0,
        shortfall: 0,
      };
    }
  },

  async checkApprove(
    publicKey: string,
    tokenRaffleIndex: number,
    targetContractIndex: number,
  ): Promise<TokenBalanceCheckResult> {
    try {
      // Get token raffle information
      const tokenRaffleInfo = await getActiveTokenRaffle(tokenRaffleIndex);
      if (!tokenRaffleInfo) {
        toast.error("Token raffle not found");
        return {
          hasEnoughBalance: false,
          currentBalance: 0,
          requiredAmount: 0,
          shortfall: 0,
        };
      }

      // Get user's token balance
      const userAssets = await fetchAssetsOwnership(publicKey);
      const tokenAsset = userAssets.find(
        (asset) =>
          asset.issuer === tokenRaffleInfo.tokenIssuer &&
          asset.assetName.toUpperCase() === tokenRaffleInfo.tokenName.toUpperCase() &&
          asset.managingContractIndex === targetContractIndex,
      );

      const currentBalance = tokenAsset?.amount || 0;
      const requiredAmount = tokenRaffleInfo.entryAmount;
      const hasEnoughBalance = currentBalance >= requiredAmount;
      const shortfall = Math.max(0, requiredAmount - currentBalance);

      if (!hasEnoughBalance) {
        toast.error(
          `Insufficient ${tokenRaffleInfo.tokenName} balance for token raffle. Required: ${requiredAmount.toLocaleString()}, Available: ${currentBalance.toLocaleString()}`,
        );
      }

      return {
        hasEnoughBalance,
        currentBalance,
        requiredAmount,
        shortfall,
        tokenName: tokenRaffleInfo.tokenName,
        tokenIssuer: tokenRaffleInfo.tokenIssuer,
        needsApproval: true, // Token raffles always need share management rights transfer
      };
    } catch (error) {
      console.error("Error checking token raffle balance:", error);
      toast.error("Failed to check token balance. Please try again.");
      return {
        hasEnoughBalance: false,
        currentBalance: 0,
        requiredAmount: 0,
        shortfall: 0,
      };
    }
  },
};
