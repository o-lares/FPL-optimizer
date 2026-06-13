const FPL_ORIGIN = "https://fantasy.premierleague.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Vary": "Origin",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "Only GET requests are allowed." }, 405);
    }

    const requestUrl = new URL(request.url);
    const targetParam = requestUrl.searchParams.get("url");

    if (!targetParam) {
      return json({ error: "Missing url query parameter." }, 400);
    }

    let targetUrl;
    try {
      targetUrl = new URL(targetParam);
    } catch {
      return json({ error: "Invalid url query parameter." }, 400);
    }

    if (targetUrl.origin !== FPL_ORIGIN || !targetUrl.pathname.startsWith("/api/")) {
      return json({ error: "Only Fantasy Premier League API requests are allowed." }, 403);
    }

    const response = await fetch(targetUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "FPL-Optimizer/1.0",
      },
    });

    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", response.headers.get("Content-Type") ?? "application/json");
    headers.set("Cache-Control", "public, max-age=60");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
