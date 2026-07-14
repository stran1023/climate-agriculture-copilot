"use client";

import type { AssetOverview } from "@/lib/api";

/** Water gradient + ring tint per status -- the water itself communicates
 * health (murky and dark when critical, bright and clear when healthy),
 * not just an overlay ring color. */
const WATER_BY_STATUS: Record<string, { water: string; ring: string }> = {
  healthy: { water: "from-sky-300 to-blue-500", ring: "ring-emerald-400" },
  needs_attention: { water: "from-cyan-700 to-blue-900", ring: "ring-amber-400" },
  critical: { water: "from-amber-900/80 to-stone-800", ring: "ring-red-500 animate-pulse" },
};

export function FishPondMarker({ asset, isSelected }: { asset: AssetOverview; isSelected?: boolean }) {
  const palette = WATER_BY_STATUS[asset.status] ?? WATER_BY_STATUS.healthy;
  const isCritical = asset.status === "critical";

  return (
    <div
      className={`relative h-12 w-20 overflow-hidden rounded-[50%] shadow-lg ring-4 dark:ring-offset-zinc-900 ${palette.ring} ${
        isSelected ? "outline outline-2 outline-offset-2 outline-blue-500" : ""
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${palette.water}`} />

      <div className="absolute inset-y-0 w-1/2 animate-[water-shimmer_3.5s_ease-in-out_infinite] bg-white/40 blur-[2px]" />

      {!isCritical && (
        <>
          <span
            className="absolute left-[28%] top-[30%] animate-[fish-swim-a_4s_ease-in-out_infinite] text-xs"
            aria-hidden
          >
            🐟
          </span>
          <span
            className="absolute left-[55%] top-[52%] animate-[fish-swim-b_5s_ease-in-out_infinite] text-xs"
            aria-hidden
          >
            🐟
          </span>
        </>
      )}

      <div className="absolute -right-1 bottom-0 h-3 w-7 -rotate-6 rounded-sm bg-amber-800/80" />
    </div>
  );
}
