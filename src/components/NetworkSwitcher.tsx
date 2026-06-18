import { useNetwork } from "../context/NetworkContext";
import { type NetworkId, NETWORKS } from "../lib/networkConfig";

export default function NetworkSwitcher() {
  const { networkId, setNetwork } = useNetwork();
  const ids = Object.keys(NETWORKS) as NetworkId[];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#0a0a0a",
        border: "3px solid #000",
        borderRadius: 12,
        padding: 4,
        boxShadow: "5px 5px 0 0 rgba(0,0,0,.9)",
        fontFamily: "'Space Grotesk',system-ui,sans-serif",
      }}
    >
      {ids.map((id) => {
        const active = networkId === id;
        return (
          <button
            key={id}
            onClick={() => setNetwork(id)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              background: active ? "#7c3aed" : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,.55)",
              transition: "all .15s ease",
              lineHeight: 1,
            }}
          >
            {id === "liteforge" ? "⚡ LiteForge" : "🔵 Base"}
          </button>
        );
      })}
    </div>
  );
}
