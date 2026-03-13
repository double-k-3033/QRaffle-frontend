import { MdLockOpen } from "react-icons/md";
import ConnectModal from "./ConnectModal";
import WalletDropdown from "./WalletDropdown";
import { useQubicConnect } from "./QubicConnectContext";
import { Button } from "../ui/button";

const ConnectLink: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const { connected, wallet, showConnectModal, toggleConnectModal } = useQubicConnect();

  return (
    <>
      {connected && wallet ? (
        <WalletDropdown wallet={wallet} onDisconnect={toggleConnectModal} />
      ) : (
        <Button
          variant="default"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => toggleConnectModal()}
          type="button"
        >
          <MdLockOpen size={20} />
          <span>Connect Wallet</span>
        </Button>
      )}
      <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal()} darkMode={darkMode} />
    </>
  );
};

export default ConnectLink;
