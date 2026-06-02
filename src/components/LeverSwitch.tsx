import React from "react";

/**
 * LeverSwitch — slot-machine lever modeled on the lever-switch component.
 *
 *   - default (`pulled = false`): knob sits up at an angle, base bar empty.
 *   - on click / when `pulled = true`: knob slams down onto the bar, the bar
 *     fills with the side colour (green for up-side, red for down-side).
 *
 * Used inline inside the EVEN / ODD buttons and the Confirm Bet button. Same
 * primitive everywhere so the action is visually consistent.
 */
export default function LeverSwitch({
  pulled,
  side = "even",
  size = 32,
  onClick,
}: {
  pulled: boolean;
  side?: string;        // 'even' | 'high' | 'over' → green; rest → red
  size?: number;        // height in px
  onClick?: () => void;
}) {
  const up = ["even", "high", "over"].includes(side.toLowerCase());
  return (
    <span
      className={`lever-mini ${pulled ? "pulled" : ""} ${up ? "em" : "ro"}`}
      style={{ ["--lh" as any]: `${size}px` }}
      onClick={onClick}
    >
      <span className="lh-arm">
        <span className="lh-rod" />
        <span className="lh-knob" />
      </span>
      <span className="lh-base">
        <span className="lh-base-in" />
      </span>
    </span>
  );
}
