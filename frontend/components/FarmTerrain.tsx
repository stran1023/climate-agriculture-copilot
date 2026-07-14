"use client";

/**
 * The ground layer of the digital twin map: a textured grass diamond
 * grid, dirt paths from a central farmhouse landmark out to each real
 * asset position, and light decorative scenery (farmhouse, corner
 * trees, a soft sun glow). Pure CSS -- no new dependency, no canvas --
 * per the cute/cartoon-farm-sim visual direction. Asset markers
 * themselves are still rendered by DigitalTwinMap.tsx, which composes
 * this component underneath them.
 */

export const TILE_W = 64;
export const TILE_H = 32;
export const GRID_SIZE = 11; // asset grid_x/grid_y are seeded in the 0-10 range

export const FARMHOUSE_POS = { gx: 5, gy: 5 };

const GRASS_SHADES = [
  "bg-emerald-500/15 dark:bg-emerald-400/10",
  "bg-emerald-600/20 dark:bg-emerald-400/15",
  "bg-lime-500/15 dark:bg-lime-400/10",
];

const PATH_SHADE = "bg-amber-700/25 dark:bg-amber-600/20";

export function isoPosition(gx: number, gy: number) {
  return {
    left: (gx - gy) * (TILE_W / 2),
    top: (gx + gy) * (TILE_H / 2),
  };
}

function tileKey(gx: number, gy: number) {
  return `${gx}-${gy}`;
}

function grassShade(gx: number, gy: number): string {
  return GRASS_SHADES[(gx * 7 + gy * 13) % GRASS_SHADES.length];
}

/** Deterministic dirt path from `from` to `to`: diagonal steps first,
 * then straight -- a simple, readable line through the iso grid, not a
 * real pathfinder (there's nothing to path around). */
function pathBetween(from: { gx: number; gy: number }, to: { gx: number; gy: number }): string[] {
  const tiles: string[] = [];
  let gx = from.gx;
  let gy = from.gy;
  while (gx !== to.gx && gy !== to.gy) {
    gx += Math.sign(to.gx - gx);
    gy += Math.sign(to.gy - gy);
    tiles.push(tileKey(gx, gy));
  }
  while (gx !== to.gx) {
    gx += Math.sign(to.gx - gx);
    tiles.push(tileKey(gx, gy));
  }
  while (gy !== to.gy) {
    gy += Math.sign(to.gy - gy);
    tiles.push(tileKey(gx, gy));
  }
  return tiles;
}

const CORNERS = [
  { gx: 0, gy: 0 },
  { gx: 0, gy: GRID_SIZE - 1 },
  { gx: GRID_SIZE - 1, gy: 0 },
  { gx: GRID_SIZE - 1, gy: GRID_SIZE - 1 },
];

/** Purely decorative set-dressing (feat-032) -- fixed candidate tiles,
 * filtered against real asset/farmhouse positions at render time so
 * nothing ever sits on top of an interactive marker. None of this
 * backs real data; it only makes the terrain read as populated. */
const EXTRA_TREES = [
  { gx: 2, gy: 1 },
  { gx: 8, gy: 1 },
  { gx: 1, gy: 8 },
  { gx: 9, gy: 8 },
  { gx: 3, gy: 9 },
  { gx: 7, gy: 2 },
];

const BUSHES = [
  { gx: 4, gy: 1 },
  { gx: 6, gy: 9 },
  { gx: 1, gy: 4 },
  { gx: 9, gy: 6 },
];

const WELL_POS = { gx: 5, gy: 2 };
const VEHICLE_POS = { gx: 3, gy: 6 };
const PERSON_POSITIONS = [
  { gx: 6, gy: 4 },
  { gx: 4, gy: 7 },
];

export function FarmTerrain({ assetPositions }: { assetPositions: { gx: number; gy: number }[] }) {
  const pathTiles = new Set<string>();
  for (const pos of assetPositions) {
    for (const t of pathBetween(FARMHOUSE_POS, pos)) pathTiles.add(t);
  }

  const tiles: { gx: number; gy: number }[] = [];
  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      tiles.push({ gx, gy });
    }
  }

  const farmhousePos = isoPosition(FARMHOUSE_POS.gx, FARMHOUSE_POS.gy);

  // Never place decorative scenery on a tile a real asset or the
  // farmhouse already occupies.
  const occupied = new Set<string>([
    tileKey(FARMHOUSE_POS.gx, FARMHOUSE_POS.gy),
    ...assetPositions.map((p) => tileKey(p.gx, p.gy)),
  ]);
  const decorativeTrees = EXTRA_TREES.filter((p) => !occupied.has(tileKey(p.gx, p.gy)));
  const decorativeBushes = BUSHES.filter((p) => !occupied.has(tileKey(p.gx, p.gy)));
  const showWell = !occupied.has(tileKey(WELL_POS.gx, WELL_POS.gy));
  const showVehicle = !occupied.has(tileKey(VEHICLE_POS.gx, VEHICLE_POS.gy));
  const decorativePeople = PERSON_POSITIONS.filter((p) => !occupied.has(tileKey(p.gx, p.gy)));
  // A sparse sample of path tiles get a small fence-post pair beside
  // them, offset from center so it never covers the walkable path.
  const fenceTiles = Array.from(pathTiles).filter((_, i) => i % 4 === 0);

  return (
    <>
      <div
        className="pointer-events-none absolute rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-400/10"
        style={{ width: 220, height: 220, right: -60, top: -100 }}
      />

      {tiles.map(({ gx, gy }) => {
        const { left, top } = isoPosition(gx, gy);
        const isPath = pathTiles.has(tileKey(gx, gy));
        return (
          <div
            key={tileKey(gx, gy)}
            className={`absolute border border-emerald-900/5 dark:border-emerald-100/5 ${
              isPath ? PATH_SHADE : grassShade(gx, gy)
            }`}
            style={{
              left,
              top,
              width: TILE_W,
              height: TILE_H,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              zIndex: gx + gy,
            }}
          />
        );
      })}

      {CORNERS.map(({ gx, gy }) => {
        const { left, top } = isoPosition(gx, gy);
        return (
          <div
            key={`tree-${gx}-${gy}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl opacity-80"
            style={{ left: left + TILE_W / 2, top: top + TILE_H / 2, zIndex: gx + gy + 50 }}
            aria-hidden
          >
            🌳
          </div>
        );
      })}

      {decorativeTrees.map(({ gx, gy }) => {
        const { left, top } = isoPosition(gx, gy);
        return (
          <div
            key={`extra-tree-${gx}-${gy}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xl opacity-75"
            style={{ left: left + TILE_W / 2, top: top + TILE_H / 2, zIndex: gx + gy + 45 }}
            aria-hidden
          >
            🌳
          </div>
        );
      })}

      {decorativeBushes.map(({ gx, gy }) => {
        const { left, top } = isoPosition(gx, gy);
        return (
          <div
            key={`bush-${gx}-${gy}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-lg opacity-70"
            style={{ left: left + TILE_W / 2, top: top + TILE_H / 2, zIndex: gx + gy + 45 }}
            aria-hidden
          >
            🌿
          </div>
        );
      })}

      {fenceTiles.map((key) => {
        const [gx, gy] = key.split("-").map(Number);
        const { left, top } = isoPosition(gx, gy);
        return (
          <div
            key={`fence-${key}`}
            className="pointer-events-none absolute flex -translate-y-1/2 gap-[3px] opacity-70"
            style={{ left: left + TILE_W / 2 + 16, top: top + TILE_H / 2, zIndex: gx + gy + 40 }}
            aria-hidden
          >
            <div className="h-3 w-[3px] rounded-sm bg-amber-800/80 dark:bg-amber-600/70" />
            <div className="h-3 w-[3px] rounded-sm bg-amber-800/80 dark:bg-amber-600/70" />
          </div>
        );
      })}

      {showWell &&
        (() => {
          const { left, top } = isoPosition(WELL_POS.gx, WELL_POS.gy);
          return (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xl opacity-90"
              style={{ left: left + TILE_W / 2, top: top + TILE_H / 2, zIndex: WELL_POS.gx + WELL_POS.gy + 45 }}
              aria-hidden
            >
              ⛲
            </div>
          );
        })()}

      {showVehicle &&
        (() => {
          const { left, top } = isoPosition(VEHICLE_POS.gx, VEHICLE_POS.gy);
          return (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xl opacity-90"
              style={{
                left: left + TILE_W / 2,
                top: top + TILE_H / 2,
                zIndex: VEHICLE_POS.gx + VEHICLE_POS.gy + 45,
              }}
              aria-hidden
            >
              🚜
            </div>
          );
        })()}

      {decorativePeople.map(({ gx, gy }) => {
        const { left, top } = isoPosition(gx, gy);
        return (
          <div
            key={`person-${gx}-${gy}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-lg opacity-90"
            style={{ left: left + TILE_W / 2, top: top + TILE_H / 2, zIndex: gx + gy + 45 }}
            aria-hidden
          >
            🧑‍🌾
          </div>
        );
      })}

      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-[80%] text-3xl"
        style={{
          left: farmhousePos.left + TILE_W / 2,
          top: farmhousePos.top,
          zIndex: FARMHOUSE_POS.gx + FARMHOUSE_POS.gy + 50,
        }}
        aria-hidden
      >
        🏡
      </div>
    </>
  );
}
