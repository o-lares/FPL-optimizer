import { FormEvent, useEffect, useMemo, useState } from "react";
import { ScoreChart } from "./components/ScoreChart";
import { ResultsTable } from "./components/ResultsTable";
import { analyzeSeason } from "./lib/analyzeSeason";
import { gapColor } from "./lib/gapColor";
import { getInitialTheme, saveTheme, type Theme } from "./lib/theme";
import type { ProgressState, SeasonResult } from "./lib/types";

export default function App() {
  const [teamId, setTeamId] = useState("");
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const leftOnPitch = result ? result.optimalTotal - result.actualTotal : 0;
  const averageLeft = result ? leftOnPitch / result.gameweeks.length : 0;
  const maxGap = result ? Math.max(...result.gameweeks.map((gameweek) => gameweek.left), 1) : 1;

  const worstGameweeks = useMemo(() => {
    if (!result) return [];
    return [...result.gameweeks].sort((a, b) => b.left - a.left).slice(0, 3);
  }, [result]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analyzed = await analyzeSeason(teamId, setProgress);
      setResult(analyzed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }

  return (
    <main className="app-shell">
      <div className="top-bar">
        <button
          className="theme-toggle"
          type="button"
          aria-pressed={theme === "dark"}
          onClick={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? "Light mode" : "Night mode"}
        </button>
      </div>

      <section className="intro-panel">
        <div>
          <p className="eyebrow">Fantasy Premier League what-if tool</p>
          <h1>FPL Optimizer</h1>
          <p className="lede">
            Enter a Team ID to see how many points were left on the pitch by lineup,
            bench, and captain choices from the squad you actually owned.
          </p>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <label htmlFor="team-id">FPL Team ID</label>
          <div className="input-row">
            <input
              id="team-id"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 1234567"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <button type="submit" disabled={isLoading || teamId.trim().length === 0}>
              {isLoading ? "Analyzing" : "Analyze"}
            </button>
          </div>
          <p className="helper-text">
            Find it in your FPL URL: fantasy.premierleague.com/entry/YOUR_ID/event/1.
            No login or API key is needed.
          </p>
        </form>
      </section>

      {progress && (
        <section className="progress-panel" aria-live="polite">
          <div className="progress-copy">
            <span>{progress.message}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
          </div>
        </section>
      )}

      {error && (
        <section className="error-panel" role="alert">
          {error}
        </section>
      )}

      {result ? (
        <section className="results-stack">
          <header className="result-header">
            <div>
              <p className="eyebrow">Analysis complete</p>
              <h2>{result.teamName}</h2>
              <p>{result.managerName || "FPL manager"} - {result.gameweeks.length} gameweeks</p>
            </div>
          </header>

          <div className="stat-grid">
            <StatCard label="Actual points" value={result.actualTotal.toLocaleString()} />
            <StatCard label="Optimal points" value={result.optimalTotal.toLocaleString()} tone="good" />
            <StatCard
              label="Left on pitch"
              value={leftOnPitch.toLocaleString()}
              color={gapColor(leftOnPitch, Math.max(leftOnPitch, 1))}
            />
            <StatCard label="Average per GW" value={averageLeft.toFixed(1)} color={gapColor(averageLeft, maxGap)} />
          </div>

          <ScoreChart gameweeks={result.gameweeks} />

          <section className="pain-panel">
            <h3>Most painful gameweeks</h3>
            <div className="pain-list">
              {worstGameweeks.map((gameweek) => (
                <div className="pain-item" key={gameweek.gw}>
                  <span>GW{gameweek.gw}</span>
                  <strong style={{ color: gapColor(gameweek.left, maxGap) }}>{gameweek.left}</strong>
                  <small>
                    Optimal captain: {formatCaptain(gameweek.optimalCaptain)}
                  </small>
                </div>
              ))}
            </div>
          </section>

          <ResultsTable gameweeks={result.gameweeks} />
        </section>
      ) : (
        <section className="empty-panel">
          <h2>What this checks</h2>
          <div className="empty-grid">
            <p>Uses your actual 15-player squad each gameweek.</p>
            <p>Finds the best valid formation and optimal captain.</p>
            <p>Does not redo transfers, chips, or season strategy.</p>
            <p>Keeps Team IDs and results in this browser session only.</p>
          </div>
        </section>
      )}

      <footer className="privacy-note">
        This app uses public FPL endpoints through a configurable CORS proxy. A proxy
        can see requested FPL URLs, including Team IDs; no passwords, cookies, or
        private tokens are sent.
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
  tone = "neutral",
}: {
  label: string;
  value: string;
  color?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong style={color ? { color } : undefined}>{value}</strong>
    </article>
  );
}

function formatCaptain(player: { name: string; points: number } | null): string {
  if (!player) {
    return "None";
  }

  return `${player.name} (${player.points} pts)`;
}
