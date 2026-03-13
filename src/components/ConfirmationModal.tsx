import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, X, Zap } from "lucide-react";
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

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  description: string;
  type?: "warning" | "info" | "success";
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  details?: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }[];
  warningMessage?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  type = "warning",
  isLoading = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  details = [],
  warningMessage,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-success h-6 w-6" />;
      case "info":
        return <Zap className="text-primary h-6 w-6" />;
      default:
        return <AlertTriangle className="text-warning h-6 w-6" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "bg-success/10";
      case "info":
        return "bg-primary/10";
      default:
        return "bg-warning/10";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`${getIconBg()} rounded-lg p-2`}>{getIcon()}</div>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-0">
          {/* Transaction Details */}
          {details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-foreground text-sm font-semibold">Transaction Details:</h4>
              <div className="space-y-2">
                {details.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-border bg-muted/30 flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-2">
                      {detail.icon}
                      <span className="text-muted-foreground text-sm font-medium">{detail.label}</span>
                    </div>
                    <span className="text-foreground text-sm font-semibold">{detail.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          {warningMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="from-warning/10 to-warning/5 border-warning/20 rounded-lg border bg-gradient-to-r p-4"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-warning mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-warning text-sm font-medium">Important Notice</p>
                  <p className="text-warning/80 text-xs leading-relaxed">{warningMessage}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center space-x-2 py-4"
            >
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground text-sm">Processing transaction...</span>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            {cancelText}
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`font-semibold shadow-lg ${
                type === "info"
                  ? "from-primary to-accent hover:from-primary/90 hover:to-accent/90 bg-gradient-to-r"
                  : "hover:bg-warning/90"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {confirmText}
                </>
              )}
            </Button>
          </motion.div>
        </DialogFooter>

        <DialogClose onClick={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
