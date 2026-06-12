import type { ChipId, PositionId, SquadPick } from "./types";

const BASE_URL = "https://fantasy.premierleague.com/api";
const DEFAULT_PROXY_TEMPLATE = "https://cors.eu.org/{url}";

const configuredProxy = import.meta.env?.VITE_FPL_PROXY_URL as string | undefined;
const proxyTemplates: string[] =
  configuredProxy === "direct"
    ? [""]
    : (configuredProxy || DEFAULT_PROXY_TEMPLATE)
        .split(",")
        .map((proxy) => proxy.trim())
        .filter(Boolean);

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
  const errors: string[] = [];

  for (const requestUrl of requestUrls) {
    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        credentials: "omit",
        headers: {
          Accept: "application/json",
        },
      });

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
    }. Your Team ID may still be valid; this is usually a proxy or network issue.`,
  );
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
