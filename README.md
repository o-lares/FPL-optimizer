# FPL Optimizer

FPL Optimizer is a static React app for Fantasy Premier League what-if analysis.
Given one FPL Team ID, it uses the squad you actually had each gameweek and
calculates the best valid XI, bench, and captain decision for that week.

## What it does

- Fetches public FPL season, squad, pick, and player score data.
- Optimizes lineup and captain decisions only.
- Does not redo transfers, chip timing, or broader season strategy.
- Shows actual points, optimal points, points left on the pitch, a chart, and
  expandable optimal XI/bench details.

## API keys

No API key is required. The app uses public, read-only FPL endpoints and must
never ask for an FPL password, auth cookie, session token, or OAuth permission.

## Security and privacy

- Team IDs and results are kept in browser memory only.
- The app does not use analytics or tracking.
- Requests use `credentials: "omit"` so browser cookies are not sent.
- The UI renders FPL data through React text bindings and does not inject raw HTML.
- GitHub Pages hosts only static files; there is no app server storing user data.
- Browser CORS requires a proxy for many static deployments. The default proxy
  is configurable with `VITE_FPL_PROXY_URL`.

Important: a third-party CORS proxy can see requested FPL API URLs, including
Team IDs. For a more private public release, replace the default proxy with your
own small proxy, such as a Cloudflare Worker.

## Local setup

```bash
npm install
npm test
npm run build
npm run dev
```

## GitHub Pages

The Vite base path is configured for a repository named `FPL-optimizer`.

After pushing to GitHub:

1. Go to the repository settings.
2. Open **Pages**.
3. Set the source to **GitHub Actions**.
4. Push to `main`; the included workflow runs audit, tests, build, and deploy.

## Configuration

Create a local `.env` file if you want to override the FPL request proxy:

```bash
VITE_FPL_PROXY_URL=https://cors.eu.org/{url}
```

Use `VITE_FPL_PROXY_URL=direct` only if direct browser requests to the FPL API
work in your environment.

You can provide comma-separated fallbacks. Use `{url}` for the raw target URL or
`{encodedUrl}` for a URL-encoded target URL.
