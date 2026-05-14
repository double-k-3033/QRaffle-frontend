import { Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import useDataFetcher from "@/hooks/useDataFetcher";
import { useEffect } from "react";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import useGlobalTxMonitor from "@/hooks/useGlobalTxMonitor";
const Layout: React.FC = () => {
  useDataFetcher();
  useGlobalTxMonitor();

  const { connect } = useQubicConnect();

  // Restore wallet from localStorage exactly once on mount.
  // We intentionally do NOT auto-connect based on snap state alone —
  // the user may have explicitly disconnected, and the snap still being
  // installed in MetaMask must not be treated as a signal to reconnect.
  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      connect(JSON.parse(storedWallet));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 justify-center pb-16">
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
