"use client";

/**
 * Shared container shape for every asset marker on the digital twin map
 * (feat-033) -- fixed size, rounded-box geometry, status ring, and
 * selected-outline handling live here once instead of being duplicated
 * (and drifting) across FishPondMarker/ChickenCoopMarker/RiceFieldMarker/
 * FruitOrchardMarker. Only the internal illustration and status ring
 * color differ per marker type.
 */
export function MarkerFrame({
  ring,
  isSelected,
  className,
  children,
}: {
  ring: string;
  isSelected?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative h-14 w-16 overflow-hidden rounded-2xl shadow-lg ring-4 dark:ring-offset-zinc-900 ${ring} ${
        isSelected ? "outline outline-2 outline-offset-2 outline-blue-500" : ""
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
