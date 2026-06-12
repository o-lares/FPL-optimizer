import { formatChip, formatPosition } from "../lib/format";
import { gapColor } from "../lib/gapColor";
import type { GameweekResult, OptimizedPlayer } from "../lib/types";

interface ResultsTableProps {
  gameweeks: GameweekResult[];
}

export function ResultsTable({ gameweeks }: ResultsTableProps) {
  const maxGap = Math.max(...gameweeks.map((gameweek) => gameweek.left), 1);

  return (
    <section className="table-panel" aria-labelledby="table-title">
      <div className="section-heading">
        <h3 id="table-title">Gameweek breakdown</h3>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>GW</th>
              <th>Official</th>
              <th>Before hits</th>
              <th>Optimal</th>
              <th>Left</th>
              <th>Hits</th>
              <th>Chip</th>
              <th>Your captain</th>
              <th>Optimal captain</th>
              <th>Optimal XI and bench</th>
            </tr>
          </thead>
          <tbody>
            {gameweeks.map((gameweek) => (
              <tr key={gameweek.gw}>
                <td>GW{gameweek.gw}</td>
                <td>{gameweek.actual}</td>
                <td>{gameweek.actualBeforeHits}</td>
                <td>{gameweek.optimal}</td>
                <td
                  className="gap-cell"
                  style={{ color: gapColor(gameweek.left, maxGap) }}
                >
                  {gameweek.left}
                </td>
                <td>{gameweek.transferCost > 0 ? `-${gameweek.transferCost}` : "0"}</td>
                <td>{formatChip(gameweek.chip)}</td>
                <td>{formatCaptain(gameweek.actualCaptain)}</td>
                <td>{formatCaptain(gameweek.optimalCaptain)}</td>
                <td>
                  <details>
                    <summary>Show players</summary>
                    <PlayerList title="Optimal XI" players={gameweek.optimalXi} />
                    <PlayerList title="Bench" players={gameweek.optimalBench} />
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatCaptain(player: OptimizedPlayer | null): string {
  if (!player) {
    return "None";
  }

  return `${player.name} (${player.points} pts)`;
}

function PlayerList({ title, players }: { title: string; players: OptimizedPlayer[] }) {
  return (
    <div className="player-list">
      <strong>{title}</strong>
      <div className="player-grid">
        {players.map((player) => (
          <span className={player.isCaptain ? "player-pill captain" : "player-pill"} key={player.id}>
            {formatPosition(player.position)} - {player.name} - {player.points} pts
            {player.isCaptain ? " - C" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
