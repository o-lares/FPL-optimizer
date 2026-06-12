import type { ChipId, PositionId } from "./types";

export function formatChip(chip: ChipId): string {
  if (!chip) return "None";

  const labels: Record<string, string> = {
    bboost: "Bench Boost",
    "3xc": "Triple Captain",
    freehit: "Free Hit",
    wildcard: "Wildcard",
  };

  return labels[chip] ?? chip;
}

export function formatPosition(position: PositionId): string {
  const labels: Record<PositionId, string> = {
    1: "GK",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };

  return labels[position];
}
