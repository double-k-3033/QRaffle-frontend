import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, AlertCircle, CheckCircle, Coins, User, Hash } from "lucide-react";
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
import { useSubmitTokenRaffleProposal } from "@/hooks/useSubmitTokenRaffleProposal";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import ConfirmationModal from "@/components/ConfirmationModal";
import { assetNameConvert, truncateMiddle } from "@/utils";

interface CreateProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({ open, onOpenChange }) => {
  const [issuer, setIssuer] = useState("");
  const [assetName, setAssetName] = useState<string>("");
  const [entryAmount, setEntryAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { handleSubmitProposal } = useSubmitTokenRaffleProposal();
  const { wallet } = useQubicConnect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !issuer.trim() || !assetName.trim() || !entryAmount.trim()) return;

    setShowConfirmation(true);
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      await handleSubmitProposal(issuer.trim(), assetNameConvert(assetName) as number, parseInt(entryAmount));
      setIssuer("");
      setAssetName("");
      setEntryAmount("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit proposal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidIssuer = (issuer: string) => {
    // Basic validation for Qubic identity format
    return issuer.length === 60 && /^[A-Za-z0-9]+$/.test(issuer);
  };

  const isValidAssetName = (assetName: string) => {
    const num = assetNameConvert(assetName) as number;
    return !isNaN(num) && num > 0 && assetName.length <= 8;
  };

  const isValidEntryAmount = (entryAmount: string) => {
    const num = parseInt(entryAmount);
    return !isNaN(num) && num > 0;
  };

  const isFormValid =
    isValidIssuer(issuer) && isValidAssetName(assetName) && isValidEntryAmount(entryAmount) && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-primary/10 rounded-lg p-1.5">
              <Plus className="text-primary h-4 w-4" />
            </div>
            <span>Create Token Raffle Proposal</span>
          </DialogTitle>
          <DialogDescription>
            Submit a proposal for a new token raffle. The proposal will be voted on by DAO members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issuer" className="text-sm font-semibold">
                Token Issuer ID
              </Label>
              <div className="relative">
                <Input
                  id="issuer"
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Enter 60-character issuer ID..."
                  className={`h-10 pr-10 text-base font-medium ${
                    issuer && !isValidIssuer(issuer) ? "border-destructive" : ""
                  }`}
                  maxLength={60}
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <User className="text-muted-foreground h-4 w-4" />
                </div>
              </div>
              {issuer && !isValidIssuer(issuer) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive flex items-center space-x-2 text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Invalid issuer ID format</span>
                </motion.div>
              )}
              {issuer && isValidIssuer(issuer) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-success flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Valid issuer ID</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetName" className="text-sm font-semibold">
                Asset Name
              </Label>
              <div className="relative">
                <Input
                  id="assetName"
                  type="string"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value.toUpperCase())}
                  placeholder="Enter asset name (e.g., STATSY)..."
                  className={`h-10 pr-10 text-base font-medium uppercase ${
                    assetName && !isValidAssetName(assetName) ? "border-destructive" : ""
                  }`}
                  min="1"
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Coins className="text-muted-foreground h-4 w-4" />
                </div>
              </div>
              {assetName && !isValidAssetName(assetName) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive flex items-center space-x-2 text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Asset name must be a positive number</span>
                </motion.div>
              )}
              {assetName && isValidAssetName(assetName) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-success flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Valid asset name</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryAmount" className="text-sm font-semibold">
                Entry Amount ({assetName})
              </Label>
              <div className="relative">
                <Input
                  id="entryAmount"
                  type="number"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder={`Enter entry amount in ${assetName}...`}
                  className={`h-10 pr-10 text-base font-medium ${
                    entryAmount && !isValidEntryAmount(entryAmount) ? "border-destructive" : ""
                  }`}
                  min="1"
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Coins className="text-muted-foreground h-4 w-4" />
                </div>
              </div>
              {entryAmount && !isValidEntryAmount(entryAmount) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive flex items-center space-x-2 text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Entry amount must be a positive number</span>
                </motion.div>
              )}
              {entryAmount && isValidEntryAmount(entryAmount) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-success flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Valid entry amount</span>
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
                  <li>• Proposals will be voted on by registered DAO members</li>
                  <li>• Approved proposals become token raffles in the next epoch</li>
                  <li>• You must be registered in the DAO to submit proposals</li>
                  <li>• Issuer ID must be exactly 60 characters long</li>
                  <li>• Asset name will be automatically converted to uppercase</li>
                  <li>• Entry amount is the cost to participate in the token raffle</li>
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Proposal
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>

        <DialogClose onClick={() => onOpenChange(false)} />
      </DialogContent>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmSubmission}
        title="Confirm Proposal Submission"
        description="Please review the proposal details before submitting. This action will create a new token raffle proposal that DAO members can vote on."
        type="info"
        isLoading={isSubmitting}
        confirmText="Submit Proposal"
        cancelText="Review Details"
        details={[
          {
            label: "Token Issuer",
            value: truncateMiddle(issuer, 40),
            icon: <User className="text-muted-foreground h-4 w-4" />,
          },
          {
            label: "Asset Name",
            value: assetName,
            icon: <Hash className="text-muted-foreground h-4 w-4" />,
          },
          {
            label: "Entry Amount",
            value: `${parseInt(entryAmount).toLocaleString()} ${assetName}`,
            icon: <Coins className="text-muted-foreground h-4 w-4" />,
          },
        ]}
        warningMessage="Once submitted, this proposal cannot be modified. Make sure all details are correct before proceeding."
      />
    </Dialog>
  );
};

export default CreateProposalModal;
