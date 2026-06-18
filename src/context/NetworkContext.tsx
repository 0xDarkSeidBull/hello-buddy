import React, { createContext, useContext, useState } from "react";
import { type NetworkId, NETWORKS, type NetworkConfig } from "../lib/networkConfig";

interface NetworkContextType {
  networkId: NetworkId;
  network: NetworkConfig;
  setNetwork: (id: NetworkId) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkId, setNetworkId] = useState<NetworkId>(() => {
    if (typeof window === "undefined") return "liteforge";
    const v = window.localStorage.getItem("selectedNetwork");
    return v === "base" || v === "liteforge" ? v : "liteforge";
  });

  const setNetwork = (id: NetworkId) => {
    setNetworkId(id);
    try { window.localStorage.setItem("selectedNetwork", id); } catch { /* */ }
    // Notify non-React modules (api.ts, wallet.ts read from localStorage directly)
    window.dispatchEvent(new CustomEvent("bob:network-changed", { detail: { id } }));
  };

  return (
    <NetworkContext.Provider value={{ networkId, network: NETWORKS[networkId], setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
