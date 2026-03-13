import React, { useState, useRef, useEffect } from "react";
import { MdLock, MdContentCopy, MdLogout } from "react-icons/md";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatQubicAmount, copyText } from "@/utils";
import { useBalance } from "@/hooks/useBalance";
import { useTxMonitor } from "@/store/txMonitor";

interface WalletDropdownProps {
  wallet: {
    connectType: string;
    publicKey: string;
    alias?: string;
  };
  onDisconnect: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({ wallet, onDisconnect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { balances, refetch: refetchBalance } = useBalance(wallet.publicKey);
  const { result } = useTxMonitor();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyAddress = () => {
    copyText(wallet.publicKey);
  };

  const handleDisconnect = () => {
    setIsOpen(false);
    onDisconnect();
  };

  useEffect(() => {
    if (result) {
      refetchBalance();
    }
  }, [result]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <MdLock size={20} />
        <span>Connected</span>
      </Button>

      {isOpen && (
        <Card className="bg-background border-border absolute top-full right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] border shadow-lg sm:w-80">
          <div className="flex max-h-[70vh] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Wallet Address Section */}
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm font-medium">Wallet Address</div>
                <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                  <span className="flex-1 font-mono text-sm break-all">{wallet.publicKey}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-8 w-8 p-1">
                    <MdContentCopy size={16} />
                  </Button>
                </div>
              </div>

              {/* Balance Section */}
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm font-medium">Balance</div>
                <div className="bg-muted rounded-md p-2">
                  <span className="text-lg font-semibold">{formatQubicAmount(balances[0]?.balance || 0)} QUBIC</span>
                </div>
              </div>
            </div>

            <div className="bg-background border-border sticky bottom-0 border-t p-4">
              <Button variant="destructive" className="flex w-full items-center gap-2" onClick={handleDisconnect}>
                <MdLogout size={16} />
                Disconnect
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WalletDropdown;
