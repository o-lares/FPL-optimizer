# FPL Optimizer Cloudflare Worker Proxy

GitHub Pages is static hosting, so browser requests to the FPL API need CORS
headers. Public CORS proxies can rate-limit or disappear. This Worker is a small
proxy you control.

It only allows `GET` requests to:

```text
https://fantasy.premierleague.com/api/*
```

## Deploy

1. Create a Cloudflare account if you do not already have one.
2. Open **Workers & Pages**.
3. Create a new Worker.
4. Replace the Worker code with `fpl-proxy.js`.
5. Deploy it.

Your Worker URL will look like:

```text
https://YOUR_WORKER.YOUR_SUBDOMAIN.workers.dev
```

## Configure the app

In GitHub, open the `FPL-optimizer` repo:

1. Go to **Settings > Secrets and variables > Actions > Variables**.
2. Add a repository variable:

```text
Name: VITE_FPL_PROXY_URL
Value: https://YOUR_WORKER.YOUR_SUBDOMAIN.workers.dev/?url={encodedUrl}
```

3. Re-run the GitHub Pages workflow.
