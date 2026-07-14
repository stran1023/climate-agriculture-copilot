"use client";

import type { AssetOverview } from "@/lib/api";
import { MarkerFrame } from "@/components/MarkerFrame";

const RING_BY_STATUS: Record<string, string> = {
  healthy: "ring-emerald-400",
  needs_attention: "ring-amber-400",
  critical: "ring-red-500 animate-pulse",
};

/** Stalk height/color per real growth_stage -- short and pale as a
 * seedling, tall and green through vegetative/reproductive, golden by
 * ripening/harvest_ready. Mirrors GROWTH_STAGES order in
 * backend/app/services/asset_simulator.py. */
const STAGE_STYLE: Record<string, { height: number; color: string }> = {
  seedling: { height: 8, color: "bg-lime-400" },
  vegetative: { height: 14, color: "bg-emerald-500" },
  reproductive: { height: 18, color: "bg-emerald-600" },
  ripening: { height: 18, color: "bg-amber-400" },
  harvest_ready: { height: 18, color: "bg-amber-500" },
};

const BLADE_COUNT = 6;

export function RiceFieldMarker({ asset, isSelected }: { asset: AssetOverview; isSelected?: boolean }) {
  const ring = RING_BY_STATUS[asset.status] ?? RING_BY_STATUS.healthy;
  const stage = STAGE_STYLE[asset.growth_stage ?? ""] ?? STAGE_STYLE.vegetative;
  const irrigated = asset.irrigation_status === "active";

  return (
    <MarkerFrame
      ring={ring}
      isSelected={isSelected}
      className={`flex items-end justify-center ${
        irrigated ? "bg-sky-100 dark:bg-sky-950/50" : "bg-amber-100/70 dark:bg-amber-950/30"
      }`}
    >
      {irrigated && (
        <div className="absolute inset-x-0 bottom-0 h-4 animate-[water-shimmer_4s_ease-in-out_infinite] bg-sky-300/50" />
      )}

      <div className="relative z-10 mb-1 flex items-end gap-[3px]">
        {Array.from({ length: BLADE_COUNT }).map((_, i) => (
          <span
            key={i}
            className={`w-[3px] origin-bottom animate-[rice-sway_2.4s_ease-in-out_infinite] rounded-full ${stage.color}`}
            style={{ height: stage.height, animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </MarkerFrame>
  );
}
