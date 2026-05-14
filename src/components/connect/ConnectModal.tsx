import { generateQRCode } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import { LuFileKey } from "react-icons/lu";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { HeaderButtons } from "./Buttons";
import { MetaMaskContext } from "./MetamaskContext";
import { useQubicConnect } from "./QubicConnectContext";
import type { Account } from "./types";
import { useWalletConnect } from "./WalletConnectContext";
import AccountSelector from "@/components/ui/account-selector";

const ConnectModal = ({ open, onClose, darkMode }: { open: boolean; onClose: () => void; darkMode?: boolean }) => {
  const [state] = useContext(MetaMaskContext);

  const [selectedMode, setSelectedMode] = useState("none");
  // Private seed handling
  const [privateSeed, setPrivateSeed] = useState("");
  const [errorMsgPrivateSeed, setErrorMsgPrivateSeed] = useState("");
  // Vault file handling
  // const [vault] = useState(new QubicVault());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [vaultError, setVaultError] = useState("");
  const [isUnlockingVault, setIsUnlockingVault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Context connect handling
  const { connect, disconnect, connected, mmSnapConnect, privateKeyConnect, vaultFileConnect } = useQubicConnect();
  // account selection
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState(0);
  // WC
  const [qrCode, setQrCode] = useState<string>("");
  const [connectionURI, setConnectionURI] = useState<string>("");
  const { connect: walletConnectConnect, isConnected, requestAccounts } = useWalletConnect();

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const generateURI = async () => {
    const { uri, approve } = await walletConnectConnect();
    const approvalPromise = approve();

    setConnectionURI(uri);
    const result = await generateQRCode(uri);
    setQrCode(result);
    await approvalPromise;
  };

  // Reset vault file state whenever the modal closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPassword("");
      setVaultError("");
      setIsUnlockingVault(false);
      setPrivateSeed("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  useEffect(() => {
    if (isConnected) {
      const fetchAccounts = async () => {
        const accounts = await requestAccounts();
        setAccounts(
          accounts.map((account) => ({
            publicId: account.address,
            alias: account.name,
          })),
        );
        setSelectedMode("account-select");
      };
      fetchAccounts();
    }
  }, [isConnected]);

  // check if input is valid seed (55 chars and only lowercase letters)
  const privateKeyValidate = (pk: string) => {
    if (pk.length !== 55) {
      setErrorMsgPrivateSeed("Seed must be 55 characters long");
    }
    if (pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed("Seed must contain only lowercase letters");
    }
    if (pk.length === 55 && !pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed("");
    }
    setPrivateSeed(pk);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".qubic-vault")) {
      alert("Please select a .qubic-vault file.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value.toString());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bg-smoke-light fixed top-0 left-0 z-50 flex h-full w-full overflow-x-hidden overflow-y-auto p-5"
          onClick={() => {
            setSelectedMode("none");
            onClose();
          }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="relative m-auto flex w-full max-w-md flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <Card className="bg-background text-foreground p-8">
              <motion.div className="flex items-center justify-between" variants={contentVariants}>
                <img
                  src={darkMode ? "/qubic-connect.svg" : "/qubic-connect-dark.svg"}
                  alt="Qubic Connect"
                  className="h-6"
                />
                <IoClose onClick={onClose} className="h-5 w-5 cursor-pointer" />
              </motion.div>

              <AnimatePresence mode="wait">
                {selectedMode === "none" && (
                  <motion.div
                    className="mt-4 flex flex-col gap-4"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {connected && (
                      <Button variant="default" className="mt-4" onClick={() => disconnect()}>
                        Disconnect Wallet
                      </Button>
                    )}
                    {!connected && (
                      <>
                        <Button
                          variant="default"
                          className="mt-4 flex items-center justify-center gap-3"
                          onClick={() => setSelectedMode("metamask")}
                        >
                          <img src={"/metamask.svg"} alt="MetaMask Logo" className="h-8 w-8" />
                          <span className="w-32">MetaMask</span>
                        </Button>
                        <Button
                          variant="default"
                          className="flex items-center justify-center gap-3"
                          onClick={() => {
                            generateURI();
                            setSelectedMode("walletconnect");
                          }}
                        >
                          <img src={"/wallet-connect.svg"} alt="Wallet Connect Logo" className="h-8 w-8" />
                          <span className="w-32">Wallet Connect</span>
                        </Button>
                        <div className="my-2 flex w-full items-center justify-center">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <span className="px-4 text-sm text-amber-500">Use with care</span>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                        <Button variant="default" onClick={() => setSelectedMode("private-seed")}>
                          Private Seed
                        </Button>
                        <Button variant="default" onClick={() => { setVaultError(""); setSelectedMode("vault-file"); }}>
                          Vault File
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}

                {selectedMode === "private-seed" && (
                  <motion.div
                    className="mt-4 space-y-2"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    Your 55 character private key (seed):
                    <Input type="password" value={privateSeed} onChange={(e) => privateKeyValidate(e.target.value)} />
                    {errorMsgPrivateSeed && <p className="text-red-500">{errorMsgPrivateSeed}</p>}
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="default" onClick={() => setSelectedMode("none")}>
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          privateKeyConnect(privateSeed);
                          setSelectedMode("none");
                          setPrivateSeed("");
                          onClose();
                        }}
                      >
                        Unlock
                      </Button>
                    </div>
                  </motion.div>
                )}

                {selectedMode === "vault-file" && (
                  <motion.div
                    className="mt-4 space-y-2"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    Load your Qubic vault file:

                    {/* Hidden native file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".qubic-vault"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* File picker row */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 active:bg-white/25"
                      >
                        Choose File
                      </button>

                      {/* File name display */}
                      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
                        {selectedFile ? (
                          <>
                            <LuFileKey className="h-4 w-4 shrink-0 text-teal-400" />
                            <span className="truncate text-sm text-white/90">{selectedFile.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-white/30">No file selected</span>
                        )}
                      </div>
                    </div>

                    <Input type="password" placeholder="Enter password" onChange={handlePasswordChange} />
                    {vaultError && <p className="text-sm text-red-500">{vaultError}</p>}
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="default" onClick={() => { setSelectedMode("none"); setVaultError(""); }}>
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        disabled={isUnlockingVault}
                        onClick={async () => {
                          if (!selectedFile) {
                            setVaultError("Please select a .qubic-vault file.");
                            return;
                          }
                          if (!password) {
                            setVaultError("Please enter your password.");
                            return;
                          }
                          setVaultError("");
                          setIsUnlockingVault(true);
                          try {
                            const vault = await vaultFileConnect(selectedFile, password);
                            setAccounts(vault.getSeeds());
                            setSelectedMode("account-select");
                          } catch (error) {
                            const msg = error instanceof Error ? error.message : String(error);
                            setVaultError(msg.includes("password") || msg.includes("Import Failed")
                              ? "Incorrect password or invalid vault file."
                              : "Failed to unlock vault. Please try again.");
                            console.error("Error unlocking vault:", error);
                          } finally {
                            setIsUnlockingVault(false);
                          }
                        }}
                      >
                        {isUnlockingVault ? "Unlocking…" : "Unlock"}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {selectedMode === "account-select" && (
                  <motion.div
                    className="mt-4 text-[rgba(128,139,155,1)]"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    Select an account:
                    <AccountSelector
                      label={"Account"}
                      options={accounts.map((account, idx) => ({
                        label: account.alias || `Account ${idx + 1}`,
                        value: account.publicId,
                      }))}
                      selected={selectedAccount}
                      setSelected={setSelectedAccount}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => {
                          disconnect();
                          setSelectedMode("none");
                        }}
                      >
                        Lock Wallet
                      </Button>
                      <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => {
                          connect({
                            connectType: "walletconnect",
                            publicKey: accounts[parseInt(selectedAccount.toString())]?.publicId,
                            alias: accounts[parseInt(selectedAccount.toString())]?.alias,
                          });
                          setSelectedMode("none");
                          onClose();
                        }}
                      >
                        Select Account
                      </Button>
                    </div>
                  </motion.div>
                )}

                {selectedMode === "metamask" && (
                  <motion.div
                    className="mt-4 text-[rgba(128,139,155,1)]"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    Connect your MetaMask wallet. You need to have MetaMask installed and unlocked.
                    <div className="mt-5 flex flex-col gap-2">
                    <HeaderButtons
                        state={state}
                        appConnected={connected}
                        onConnectClick={() => {
                          mmSnapConnect();
                          setSelectedMode("none");
                          onClose();
                        }}
                      />
                      <Button variant="outline" className="text-primary-40" onClick={() => setSelectedMode("none")}>
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {selectedMode === "walletconnect" && (
                  <motion.div
                    className="mt-4 text-[rgba(128,139,155,1)]"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    Connect your Qubic Wallet. You need to have Qubic Wallet installed and unlocked.
                    <div className="mt-5 flex flex-col gap-2">
                      <div className="flex min-h-54 min-w-54 flex-col items-center justify-center">
                        {qrCode ? (
                          <img src={qrCode} alt="Wallet Connect QR Code" className="mx-auto h-54 w-54" />
                        ) : (
                          <div className="border-foreground mx-auto h-8 w-8 animate-spin rounded-full border-t-2"></div>
                        )}
                      </div>
                      <Button
                        variant="default"
                        className="flex items-center justify-center gap-3"
                        onClick={() => window.open(`qubic-wallet://pairwc/${connectionURI}`, "_blank")}
                        disabled={!connectionURI}
                      >
                        Open in Qubic Wallet
                      </Button>
                      <Button variant="outline" className="text-primary-40" onClick={() => setSelectedMode("none")}>
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectModal;
