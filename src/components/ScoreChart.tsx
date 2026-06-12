import type { GameweekResult } from "../lib/types";

interface ScoreChartProps {
  gameweeks: GameweekResult[];
}

export function ScoreChart({ gameweeks }: ScoreChartProps) {
  const maxScore = Math.max(...gameweeks.flatMap((gameweek) => [gameweek.actual, gameweek.optimal]), 1);

  return (
    <section className="chart-panel" aria-labelledby="chart-title">
      <div className="section-heading">
        <h3 id="chart-title">Actual vs optimal by gameweek</h3>
        <div className="legend">
          <span><i className="legend-actual" />Actual</span>
          <span><i className="legend-optimal" />Optimal</span>
        </div>
      </div>
      <div className="chart-scroll">
        <div className="bar-chart">
          {gameweeks.map((gameweek) => (
            <div className="bar-group" key={gameweek.gw}>
              <div className="bars" title={`GW${gameweek.gw}: actual ${gameweek.actual}, optimal ${gameweek.optimal}`}>
                <span
                  className="bar actual"
                  style={{ height: `${Math.max(4, (gameweek.actual / maxScore) * 100)}%` }}
                />
                <span
                  className="bar optimal"
                  style={{ height: `${Math.max(4, (gameweek.optimal / maxScore) * 100)}%` }}
                />
              </div>
              <span className="bar-label">{gameweek.gw}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
