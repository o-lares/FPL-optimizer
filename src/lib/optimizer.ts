import type { OptimizationResult, PositionId } from "./types";

const SQUAD_SIZE = 15;
const LINEUP_SIZE = 11;

export function isValidFormation(lineup: number[], positions: Record<number, PositionId>): boolean {
  const counts: Record<PositionId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const playerId of lineup) {
    const position = positions[playerId];
    if (!position) {
      return false;
    }
    counts[position] += 1;
  }

  return (
    counts[1] === 1 &&
    counts[2] >= 3 &&
    counts[2] <= 5 &&
    counts[3] >= 2 &&
    counts[3] <= 5 &&
    counts[4] >= 1 &&
    counts[4] <= 3
  );
}

export function findOptimalLineup(
  squad: number[],
  scores: Record<number, number>,
  positions: Record<number, PositionId>,
  chip: string | null,
): OptimizationResult {
  if (squad.length !== SQUAD_SIZE) {
    throw new Error(`Expected a 15-player squad, received ${squad.length}.`);
  }

  const captainMultiplier = chip === "3xc" ? 3 : 2;
  const isBenchBoost = chip === "bboost";
  const allSquadPoints = isBenchBoost ? sumPoints(squad, scores) : 0;

  let best: OptimizationResult | null = null;
  let bestCaptainPoints = Number.NEGATIVE_INFINITY;

  for (const lineup of combinations(squad, LINEUP_SIZE)) {
    if (!isValidFormation(lineup, positions)) {
      continue;
    }

    const captainId = chooseCaptain(lineup, scores);
    const captainPoints = scores[captainId] ?? 0;
    const basePoints = isBenchBoost ? allSquadPoints : sumPoints(lineup, scores);
    const points = basePoints + captainPoints * (captainMultiplier - 1);

    if (
      best === null ||
      points > best.points ||
      (points === best.points && captainPoints > bestCaptainPoints)
    ) {
      best = {
        points,
        captainId,
        startingIds: [...lineup],
        benchIds: squad.filter((playerId) => !lineup.includes(playerId)),
      };
      bestCaptainPoints = captainPoints;
    }
  }

  if (!best) {
    throw new Error("No valid FPL formation could be built from this squad.");
  }

  return best;
}

function chooseCaptain(lineup: number[], scores: Record<number, number>): number {
  return lineup.reduce((bestId, playerId) => {
    const bestScore = scores[bestId] ?? 0;
    const playerScore = scores[playerId] ?? 0;
    return playerScore > bestScore ? playerId : bestId;
  }, lineup[0]);
}

function sumPoints(playerIds: number[], scores: Record<number, number>): number {
  return playerIds.reduce((sum, playerId) => sum + (scores[playerId] ?? 0), 0);
}

function* combinations<T>(items: T[], size: number): Generator<T[]> {
  const current: T[] = [];

  function* walk(start: number): Generator<T[]> {
    if (current.length === size) {
      yield [...current];
      return;
    }

    for (let i = start; i <= items.length - (size - current.length); i += 1) {
      current.push(items[i]);
      yield* walk(i + 1);
      current.pop();
    }
  }

  yield* walk(0);
}
