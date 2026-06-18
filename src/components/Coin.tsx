import React from "react";
import { useNetwork } from "../context/NetworkContext";

const ZKLTC_URL = "https://raw.githubusercontent.com/dopedopex/your-friendly-helper/main/zkltc.jpg";
const USDC_URL = "https://raw.githubusercontent.com/0xDarkSeidBull/betsonblock/main/usdc.jpg";

export default function Coin({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  const { networkId, network } = useNetwork();
  const url = networkId === "base" ? USDC_URL : ZKLTC_URL;
  return (
    <img
      src={url}
      alt={network.currency}
      width={size}
      height={size}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        verticalAlign: "-3px",
        objectFit: "cover",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// Alias for explicit currency-icon usage.
export const CurrencyIcon = Coin;
