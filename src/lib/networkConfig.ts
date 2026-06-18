export type NetworkId = "liteforge" | "base";

export const NETWORKS = {
  liteforge: {
    id: "liteforge" as const,
    name: "LiteForge",
    currency: "zkLTC",
    stakeAmount: 0.01,
    stakeDisplay: "0.01 zkLTC",
    chainId: 4441,
    chainIdHex: "0x115D",
    rpcUrl: "https://liteforge.rpc.caldera.xyz/http",
    apiBase: "http://155.133.23.14:3201",
    houseAddress: "0x554FA14360dEaE7A7ec6b9216Fa9Ca3cA76983a0",
    isNative: true,
  },
  base: {
    id: "base" as const,
    name: "Base",
    currency: "USDC",
    stakeAmount: 0.1,
    stakeDisplay: "0.1 USDC",
    chainId: 8453,
    chainIdHex: "0x2105",
    rpcUrl: "https://mainnet.base.org",
    apiBase: "http://155.133.23.14:3202",
    houseAddress: "0x3BC6348E1E569E97Bd8247b093475A4aC22B9fD4",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    isNative: false,
  },
} as const;

export type NetworkConfig = (typeof NETWORKS)[NetworkId];

export function getActiveNetworkId(): NetworkId {
  if (typeof window === "undefined") return "liteforge";
  const v = window.localStorage.getItem("selectedNetwork");
  return v === "base" || v === "liteforge" ? v : "liteforge";
}
