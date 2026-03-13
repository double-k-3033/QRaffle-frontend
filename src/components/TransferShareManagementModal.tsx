import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, CheckCircle, Coins, Hash, Shield, ArrowLeftRight, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useTransferShareManagementRights from "@/hooks/useTransferShareManagementRight";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import { truncateMiddle } from "@/utils";
import { SC_INDEX } from "@/services/sc.service";
import { fetchAssetsBalance } from "@/services/rpc.service";

interface TransferShareManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fixed QXMR constants
const QXMR_ASSET_NAME = "QXMR";
const QXMR_ISSUER = "QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB";
const QX_CONTRACT_INDEX = 1;
const QRAFFLE_CONTRACT_INDEX = SC_INDEX;

const TransferShareManagementModal: React.FC<TransferShareManagementModalProps> = ({ open, onOpenChange }) => {
  const [numberOfShares, setNumberOfShares] = useState("");
  const [transferDirection, setTransferDirection] = useState<"QX_TO_QRAFFLE" | "QRAFFLE_TO_QX">("QX_TO_QRAFFLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [qxBalance, setQxBalance] = useState<number | null>(null);
  const [qraffleBalance, setQraffleBalance] = useState<number | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const { handleTransferShareRights } = useTransferShareManagementRights();
  const { wallet } = useQubicConnect();

  const fetchBalances = async () => {
    if (!wallet?.publicKey) return;
    
    setIsLoadingBalances(true);
    try {
      const [qxBal, qraffleBal] = await Promise.all([
        fetchAssetsBalance(wallet.publicKey, QXMR_ASSET_NAME, QX_CONTRACT_INDEX),
        fetchAssetsBalance(wallet.publicKey, QXMR_ASSET_NAME, QRAFFLE_CONTRACT_INDEX),
      ]);
      setQxBalance(qxBal);
      setQraffleBalance(qraffleBal);
    } catch (error) {
      console.error("Failed to fetch QXMR balances:", error);
      setQxBalance(0);
      setQraffleBalance(0);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    if (open && wallet?.publicKey) {
      fetchBalances();
    }
  }, [open, wallet?.publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !numberOfShares.trim()) return;

    setShowConfirmation(true);
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);

    const isFromQX = transferDirection === "QX_TO_QRAFFLE";
    const targetContractIndex = isFromQX ? QRAFFLE_CONTRACT_INDEX : QX_CONTRACT_INDEX;

    try {
      await handleTransferShareRights({
        assetName: QXMR_ASSET_NAME,
        assetIssuer: QXMR_ISSUER,
        contractIndex: targetContractIndex,
        amount: parseInt(numberOfShares),
        isFromQX,
        fallback: async () => {
          // Refresh balances after successful transfer
          await fetchBalances();
        },
      });

      // Reset form
      setNumberOfShares("");
      setTransferDirection("QX_TO_QRAFFLE");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to transfer share management rights:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidNumber = (value: string) => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0;
  };

  const isFormValid = isValidNumber(numberOfShares) && !isSubmitting;

  const sourceContract = transferDirection === "QX_TO_QRAFFLE" ? "QX" : "QRaffle";
  const targetContract = transferDirection === "QX_TO_QRAFFLE" ? "QRaffle" : "QX";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="bg-primary/10 rounded-lg p-1.5">
                <ArrowRight className="text-primary h-4 w-4" />
              </div>
              <span>Transfer QXMR Management Rights</span>
            </DialogTitle>
            <DialogDescription>
              Transfer QXMR share management rights between QX and QRaffle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
            <div className="space-y-4">
              {/* Asset Information - Display Only */}
              <div className="from-muted/30 to-muted/10 border-muted/50 rounded-lg border bg-gradient-to-r p-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Hash className="text-primary h-4 w-4" />
                    <span className="text-foreground text-sm font-semibold">Asset: {QXMR_ASSET_NAME}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    <div className="flex items-start space-x-2">
                      <span className="font-medium">Issuer:</span>
                      <span className="break-all">{truncateMiddle(QXMR_ISSUER, 50)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QXMR Balances */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Your QXMR Balances</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchBalances}
                    disabled={isLoadingBalances || !wallet?.publicKey}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingBalances ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="from-card to-card/80 border-primary/20 rounded-lg border bg-gradient-to-br p-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="text-primary h-4 w-4" />
                      <span className="text-muted-foreground text-xs font-medium">QX</span>
                    </div>
                    <div className="text-foreground mt-1 text-lg font-bold">
                      {isLoadingBalances ? (
                        <span className="text-muted-foreground text-sm">Loading...</span>
                      ) : qxBalance !== null ? (
                        qxBalance.toLocaleString()
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">QXMR shares</div>
                  </div>
                  <div className="from-card to-card/80 border-accent/20 rounded-lg border bg-gradient-to-br p-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="text-accent h-4 w-4" />
                      <span className="text-muted-foreground text-xs font-medium">QRaffle</span>
                    </div>
                    <div className="text-foreground mt-1 text-lg font-bold">
                      {isLoadingBalances ? (
                        <span className="text-muted-foreground text-sm">Loading...</span>
                      ) : qraffleBalance !== null ? (
                        qraffleBalance.toLocaleString()
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">QXMR shares</div>
                  </div>
                </div>
              </div>

              {/* Transfer Direction Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Transfer Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={transferDirection === "QX_TO_QRAFFLE" ? "default" : "outline"}
                    className="h-auto flex-col items-start space-y-1 p-3"
                    onClick={() => setTransferDirection("QX_TO_QRAFFLE")}
                  >
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold">QX → QRaffle</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={transferDirection === "QRAFFLE_TO_QX" ? "default" : "outline"}
                    className="h-auto flex-col items-start space-y-1 p-3"
                    onClick={() => setTransferDirection("QRAFFLE_TO_QX")}
                  >
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold">QRaffle → QX</span>
                    </div>
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Transferring from <span className="font-semibold">{sourceContract}</span> to{" "}
                  <span className="font-semibold">{targetContract}</span>
                </p>
              </div>

              {/* Number of Shares */}
              <div className="space-y-2">
                <Label htmlFor="numberOfShares" className="text-sm font-semibold">
                  Number of QXMR Shares
                </Label>
                <div className="relative">
                  <Input
                    id="numberOfShares"
                    type="number"
                    value={numberOfShares}
                    onChange={(e) => setNumberOfShares(e.target.value)}
                    placeholder="Enter number of shares to transfer..."
                    className={`h-10 pr-10 text-base font-medium ${
                      numberOfShares && !isValidNumber(numberOfShares) ? "border-destructive" : ""
                    }`}
                    min="1"
                  />
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <Coins className="text-muted-foreground h-4 w-4" />
                  </div>
                </div>
                {numberOfShares && !isValidNumber(numberOfShares) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive flex items-center space-x-2 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Number of shares must be a positive number</span>
                  </motion.div>
                )}
                {numberOfShares && isValidNumber(numberOfShares) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-success flex items-center space-x-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Valid number of shares</span>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="from-muted/30 to-muted/10 border-muted/50 rounded-lg border bg-gradient-to-r p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-medium">Important Notes:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• This transfers QXMR management rights between QX and QRaffle</li>
                    <li>• Ensure you have enough QXMR shares in the {sourceContract} contract</li>
                    <li>• Transaction fees apply based on the source contract</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="from-primary to-accent hover:from-primary/90 hover:to-accent/90 bg-gradient-to-r font-semibold shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Transfer QXMR Rights
                    </>
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>

          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmTransfer}
        title="Confirm QXMR Management Rights Transfer"
        description="Please review the transfer details carefully. This will transfer management rights of your QXMR shares between contracts."
        type="warning"
        isLoading={isSubmitting}
        confirmText="Confirm Transfer"
        cancelText="Review Details"
        details={[
          {
            label: "Asset",
            value: QXMR_ASSET_NAME,
            icon: <Hash className="text-muted-foreground h-4 w-4" />,
          },
          {
            label: "Transfer Direction",
            value: transferDirection === "QX_TO_QRAFFLE" ? "QX → QRaffle" : "QRaffle → QX",
            icon: <ArrowLeftRight className="text-muted-foreground h-4 w-4" />,
          },
          {
            label: "Source Contract",
            value: `${sourceContract}`,
            icon: <Shield className="text-muted-foreground h-4 w-4" />,
          },
          {
            label: "Target Contract",
            value: `${targetContract}`,
            icon: <Shield className="text-muted-foreground h-4 w-4" />,
          },
          {
            label: "Number of Shares",
            value: `${parseInt(numberOfShares).toLocaleString()} QXMR`,
            icon: <Coins className="text-muted-foreground h-4 w-4" />,
          },
        ]}
        warningMessage="This action transfers QXMR management rights and cannot be easily reversed. Ensure you have sufficient QXMR shares in the source contract."
      />
    </>
  );
};

export default TransferShareManagementModal;

