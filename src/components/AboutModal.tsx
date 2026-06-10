import React from "react";
import { Info } from "lucide-react";

export default function AboutModal({ onOpen }: { onOpen?: () => void }) {
  const handleClick = () => {
    if (onOpen) return onOpen();
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/about");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
  return (
    <button
      onClick={handleClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#ffffff", color: "#0f172a",
        border: "2px solid #0f172a",
        borderRadius: 10, padding: "8px 14px",
        fontWeight: 800, fontSize: 13, cursor: "pointer",
        fontFamily: "'Space Grotesk',system-ui,sans-serif",
        boxShadow: "3px 3px 0 0 rgba(15,23,42,.9)",
        letterSpacing: ".04em", textTransform: "uppercase",
      }}
    >
      <Info size={14} /> About
    </button>
  );
}
