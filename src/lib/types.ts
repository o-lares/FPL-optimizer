export type PositionId = 1 | 2 | 3 | 4;

export type ChipId = "bboost" | "3xc" | "freehit" | "wildcard" | string | null;

export interface PlayerMeta {
  id: number;
  name: string;
  position: PositionId;
}

export interface SquadPick {
  element: number;
  position: number;
  is_captain?: boolean;
  is_vice_captain?: boolean;
}

export interface OptimizedPlayer {
  id: number;
  name: string;
  position: PositionId;
  points: number;
  isCaptain: boolean;
}

export interface OptimizationResult {
  points: number;
  captainId: number | null;
  startingIds: number[];
  benchIds: number[];
}

export interface GameweekResult {
  gw: number;
  actual: number;
  optimal: number;
  left: number;
  chip: ChipId;
  actualCaptain: OptimizedPlayer | null;
  optimalCaptain: OptimizedPlayer | null;
  optimalXi: OptimizedPlayer[];
  optimalBench: OptimizedPlayer[];
}

export interface SeasonResult {
  teamName: string;
  managerName: string;
  gameweeks: GameweekResult[];
  actualTotal: number;
  optimalTotal: number;
}

export interface ProgressState {
  message: string;
  percent: number;
}
