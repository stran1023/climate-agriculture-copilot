"use client";

import type { AssetOverview } from "@/lib/api";
import { MarkerFrame } from "@/components/MarkerFrame";

const RING_BY_STATUS: Record<string, string> = {
  healthy: "ring-emerald-400",
  needs_attention: "ring-amber-400",
  critical: "ring-red-500 animate-pulse",
};

/** More, riper fruit as the real harvest_readiness_pct climbs. */
function fruitCount(pct: number | null): number {
  if (pct === null) return 1;
  return Math.max(1, Math.min(6, Math.round(pct / 18)));
}

function fruitColor(pct: number | null): string {
  if (pct === null || pct < 40) return "bg-lime-500";
  if (pct < 75) return "bg-orange-400";
  return "bg-orange-600";
}

const FRUIT_POSITIONS = [
  { left: "20%", top: "15%" },
  { left: "55%", top: "10%" },
  { left: "10%", top: "45%" },
  { left: "60%", top: "45%" },
  { left: "35%", top: "60%" },
  { left: "40%", top: "30%" },
];

export function FruitOrchardMarker({ asset, isSelected }: { asset: AssetOverview; isSelected?: boolean }) {
  const ring = RING_BY_STATUS[asset.status] ?? RING_BY_STATUS.healthy;
  const count = fruitCount(asset.harvest_readiness_pct);
  const color = fruitColor(asset.harvest_readiness_pct);
  const perTree = [Math.ceil(count / 2), Math.floor(count / 2)];

  return (
    <MarkerFrame
      ring={ring}
      isSelected={isSelected}
      className="flex items-end justify-center gap-1.5 bg-lime-50 pb-1 dark:bg-lime-950/30"
    >
      {perTree.map((fruitOnThisTree, treeIdx) => (
        <div key={treeIdx} className="flex flex-col items-center">
          <div
            className="relative h-7 w-7 origin-bottom animate-[tree-sway_3s_ease-in-out_infinite] rounded-full bg-emerald-600 dark:bg-emerald-700"
            style={{ animationDelay: `${treeIdx * 0.4}s` }}
          >
            {Array.from({ length: fruitOnThisTree }).map((_, i) => (
              <span
                key={i}
                className={`absolute h-1.5 w-1.5 rounded-full ${color}`}
                style={FRUIT_POSITIONS[i % FRUIT_POSITIONS.length]}
                aria-hidden
              />
            ))}
          </div>
          <div className="h-2 w-1.5 bg-amber-900/70" />
        </div>
      ))}
    </MarkerFrame>
  );
}
