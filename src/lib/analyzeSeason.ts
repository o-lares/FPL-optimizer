import type { FplClient, FplLiveResponse } from "./fplApi";
import { fplClient, validateTeamId } from "./fplApi";
import { findOptimalLineup } from "./optimizer";
import type {
  GameweekResult,
  OptimizedPlayer,
  PlayerMeta,
  PositionId,
  ProgressState,
  SeasonResult,
} from "./types";

type ProgressCallback = (progress: ProgressState) => void;

export async function analyzeSeason(
  rawTeamId: string,
  onProgress: ProgressCallback,
  client: FplClient = fplClient,
): Promise<SeasonResult> {
  const teamId = validateTeamId(rawTeamId);

  onProgress({ message: "Fetching squad and manager data", percent: 5 });
  const [bootstrap, entry, history] = await Promise.all([
    client.getBootstrap(),
    client.getEntry(teamId),
    client.getHistory(teamId),
  ]);

  const playerMeta = Object.fromEntries(
    bootstrap.elements.map((player) => [
      player.id,
      {
        id: player.id,
        name: player.web_name,
        position: player.element_type,
      } satisfies PlayerMeta,
    ]),
  );
  const positions = Object.fromEntries(
    bootstrap.elements.map((player) => [player.id, player.element_type]),
  ) as Record<number, PositionId>;

  if (history.current.length === 0) {
    throw new Error("No completed gameweeks were found for that Team ID.");
  }

  const gameweeks: GameweekResult[] = [];

  for (let index = 0; index < history.current.length; index += 1) {
    const gwHistory = history.current[index];
    const progress = 10 + Math.round((index / history.current.length) * 85);
    onProgress({ message: `Analyzing GW${gwHistory.event}`, percent: progress });

    const [picks, live] = await Promise.all([
      client.getPicks(teamId, gwHistory.event),
      client.getLiveScores(gwHistory.event),
    ]);

    const scores = mapScores(live);
    const squad = picks.picks.map((pick) => pick.element);
    const actualCaptainId = picks.picks.find((pick) => pick.is_captain)?.element ?? null;
    const optimal = findOptimalLineup(squad, scores, positions, picks.active_chip);
    const actual = gwHistory.points;

    gameweeks.push({
      gw: gwHistory.event,
      actual,
      optimal: optimal.points,
      left: optimal.points - actual,
      chip: picks.active_chip,
      actualCaptain: actualCaptainId
        ? toOptimizedPlayer(actualCaptainId, actualCaptainId, playerMeta, scores)
        : null,
      optimalCaptain: optimal.captainId
        ? toOptimizedPlayer(optimal.captainId, optimal.captainId, playerMeta, scores)
        : null,
      optimalXi: optimal.startingIds.map((playerId) =>
        toOptimizedPlayer(playerId, optimal.captainId, playerMeta, scores),
      ),
      optimalBench: optimal.benchIds.map((playerId) =>
        toOptimizedPlayer(playerId, optimal.captainId, playerMeta, scores),
      ),
    });
  }

  onProgress({ message: "Done", percent: 100 });

  return {
    teamName: entry.name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
    gameweeks,
    actualTotal: gameweeks.reduce((sum, gw) => sum + gw.actual, 0),
    optimalTotal: gameweeks.reduce((sum, gw) => sum + gw.optimal, 0),
  };
}

function mapScores(live: FplLiveResponse): Record<number, number> {
  return Object.fromEntries(
    live.elements.map((player) => [player.id, player.stats.total_points]),
  );
}

function toOptimizedPlayer(
  playerId: number,
  captainId: number | null,
  playerMeta: Record<number, PlayerMeta>,
  scores: Record<number, number>,
): OptimizedPlayer {
  const meta = playerMeta[playerId];

  if (!meta) {
    return {
      id: playerId,
      name: `Player ${playerId}`,
      position: 4,
      points: scores[playerId] ?? 0,
      isCaptain: playerId === captainId,
    };
  }

  return {
    id: playerId,
    name: meta.name,
    position: meta.position,
    points: scores[playerId] ?? 0,
    isCaptain: playerId === captainId,
  };
}
