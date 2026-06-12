# Security Policy

## Data handling

FPL Optimizer is a static client-side app. It does not run a backend server and
does not store Team IDs or results outside the browser session.

The app must not request or process:

- FPL passwords
- FPL session cookies
- OAuth tokens
- API keys
- private league administration credentials

## Network requests

The app calls public, read-only Fantasy Premier League API endpoints with
`credentials: "omit"`. Browser cookies are not intentionally sent.

Because GitHub Pages is static hosting, browser deployments may need a CORS
proxy. Any third-party proxy can see requested FPL API URLs, including Team IDs.
For a broader public launch, use a proxy you control and keep it restricted to
the specific FPL API host.

## Reporting issues

For now, open a GitHub issue for security or privacy concerns. Do not include
private credentials in any issue.
