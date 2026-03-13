import { Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import useDataFetcher from "@/hooks/useDataFetcher";
import { useContext, useEffect } from "react";
import { useQubicConnect } from "@/components/connect/QubicConnectContext";
import { MetaMaskContext } from "@/components/connect/MetamaskContext";
import useGlobalTxMonitor from "@/hooks/useGlobalTxMonitor";

const Layout: React.FC = () => {
  useDataFetcher();
  useGlobalTxMonitor();

  const [state] = useContext(MetaMaskContext);
  const { mmSnapConnect, connect } = useQubicConnect();

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet) {
      connect(JSON.parse(storedWallet));
    } else if (state.installedSnap) {
      mmSnapConnect();
    }
  }, [state]);

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
