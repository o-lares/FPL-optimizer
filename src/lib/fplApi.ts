import type { ChipId, PositionId, SquadPick } from "./types";

const BASE_URL = "https://fantasy.premierleague.com/api";
const DEFAULT_PROXY_TEMPLATE = "https://cors.eu.org/{url}";
const REQUEST_SPACING_MS = 250;
const FETCH_TIMEOUT_MS = 15000;

const configuredProxy = import.meta.env?.VITE_FPL_PROXY_URL as string | undefined;
const proxyTemplates: string[] =
  configuredProxy === "direct"
    ? [""]
    : (configuredProxy || DEFAULT_PROXY_TEMPLATE)
        .split(",")
        .map((proxy) => proxy.trim())
        .filter(Boolean);
let requestQueue = Promise.resolve();

export interface FplBootstrapResponse {
  elements: Array<{
    id: number;
    web_name: string;
    element_type: PositionId;
  }>;
}

export interface FplEntryResponse {
  name: string;
  player_first_name: string;
  player_last_name: string;
}

export interface FplHistoryResponse {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    event_transfers_cost: number;
  }>;
}

export interface FplPicksResponse {
  active_chip: ChipId;
  picks: SquadPick[];
}

export interface FplLiveResponse {
  elements: Array<{
    id: number;
    stats: {
      total_points: number;
    };
  }>;
}

export interface FplClient {
  getBootstrap(): Promise<FplBootstrapResponse>;
  getEntry(teamId: string): Promise<FplEntryResponse>;
  getHistory(teamId: string): Promise<FplHistoryResponse>;
  getPicks(teamId: string, gw: number): Promise<FplPicksResponse>;
  getLiveScores(gw: number): Promise<FplLiveResponse>;
}

export const fplClient: FplClient = {
  getBootstrap: () => fetchFpl("/bootstrap-static/"),
  getEntry: (teamId) => fetchFpl(`/entry/${teamId}/`),
  getHistory: (teamId) => fetchFpl(`/entry/${teamId}/history/`),
  getPicks: (teamId, gw) => fetchFpl(`/entry/${teamId}/event/${gw}/picks/`),
  getLiveScores: (gw) => fetchFpl(`/event/${gw}/live/`),
};

export function validateTeamId(teamId: string): string {
  const normalized = teamId.trim();

  if (!/^\d+$/.test(normalized)) {
    throw new Error("Enter a numeric FPL Team ID.");
  }

  return normalized;
}

async function fetchFpl<T>(path: string): Promise<T> {
  const targetUrl = `${BASE_URL}${path}`;
  const requestUrls = proxyTemplates.map((template) => buildRequestUrl(template, targetUrl));

  const queuedRequest = requestQueue.then(() => fetchWithFallbacks<T>(requestUrls));
  requestQueue = queuedRequest.then(
    () => undefined,
    () => undefined,
  );

  return queuedRequest;
}

async function fetchWithFallbacks<T>(requestUrls: string[]): Promise<T> {
  const errors: string[] = [];

  await sleep(REQUEST_SPACING_MS);

  for (const requestUrl of requestUrls) {
    try {
      const response = await fetchWithTimeout(requestUrl);

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      const detail = await response.text().catch(() => "");
      errors.push(`${response.status}${detail ? `: ${detail.slice(0, 120)}` : ""}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Network request failed");
    }
  }

  throw new Error(
    `FPL request failed through the configured proxy. Last error: ${
      errors.at(-1) ?? "unknown"
    }. Your Team ID may still be valid; this is usually a proxy, CORS, or rate-limit issue.`,
  );
}

async function fetchWithTimeout(requestUrl: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(requestUrl, {
      method: "GET",
      credentials: "omit",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildRequestUrl(template: string, targetUrl: string): string {
  if (!template) {
    return targetUrl;
  }

  if (template.includes("{url}") || template.includes("{encodedUrl}")) {
    return template
      .replaceAll("{url}", targetUrl)
      .replaceAll("{encodedUrl}", encodeURIComponent(targetUrl));
  }

  return `${template}${encodeURIComponent(targetUrl)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
