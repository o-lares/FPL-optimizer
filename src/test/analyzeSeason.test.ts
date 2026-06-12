import { describe, expect, it } from "vitest";
import { analyzeSeason } from "../lib/analyzeSeason";
import type { FplClient } from "../lib/fplApi";
import type { PositionId } from "../lib/types";

const elements = [
  [1, "Keeper A", 1],
  [2, "Keeper B", 1],
  [3, "Def A", 2],
  [4, "Def B", 2],
  [5, "Def C", 2],
  [6, "Def D", 2],
  [7, "Def E", 2],
  [8, "Mid A", 3],
  [9, "Mid B", 3],
  [10, "Mid C", 3],
  [11, "Mid D", 3],
  [12, "Mid E", 3],
  [13, "Fwd A", 4],
  [14, "Fwd B", 4],
  [15, "Fwd C", 4],
] as const;

const mockClient: FplClient = {
  getBootstrap: async () => ({
    elements: elements.map(([id, web_name, element_type]) => ({
      id,
      web_name,
      element_type: element_type as PositionId,
    })),
  }),
  getEntry: async () => ({
    name: "Test FC",
    player_first_name: "Ada",
    player_last_name: "Lovelace",
  }),
  getHistory: async () => ({
    current: [
      { event: 1, points: 40, total_points: 40, event_transfers_cost: 0 },
      { event: 2, points: 50, total_points: 86, event_transfers_cost: 4 },
    ],
  }),
  getPicks: async (_teamId, gw) => ({
    active_chip: gw === 2 ? "3xc" : null,
    picks: Array.from({ length: 15 }, (_, index) => ({
      element: index + 1,
      position: index + 1,
      is_captain: gw === 1 ? index + 1 === 8 : index + 1 === 13,
    })),
  }),
  getLiveScores: async (gw) => ({
    elements: Array.from({ length: 15 }, (_, index) => ({
      id: index + 1,
      stats: {
        total_points: gw === 1 && index + 1 === 10 ? 13 : gw === 2 && index + 1 === 13 ? 10 : 2,
      },
    })),
  }),
};

describe("analyzeSeason", () => {
  it("builds season totals and per-gameweek optimal details", async () => {
    const progress: string[] = [];
    const result = await analyzeSeason("12345", (state) => progress.push(state.message), mockClient);

    expect(result.teamName).toBe("Test FC");
    expect(result.managerName).toBe("Ada Lovelace");
    expect(result.gameweeks).toHaveLength(2);
    expect(result.actualTotal).toBe(86);
    expect(result.actualBeforeHitsTotal).toBe(90);
    expect(result.transferCostTotal).toBe(4);
    expect(result.optimalTotal).toBe(92);
    expect(result.gameweeks[1].actual).toBe(46);
    expect(result.gameweeks[1].actualBeforeHits).toBe(50);
    expect(result.gameweeks[1].optimal).toBe(46);
    expect(result.gameweeks[1].optimalBeforeHits).toBe(50);
    expect(result.gameweeks[1].transferCost).toBe(4);
    expect(result.gameweeks[0].actualCaptain?.name).toBe("Mid A");
    expect(result.gameweeks[0].actualCaptain?.points).toBe(2);
    expect(result.gameweeks[0].optimalCaptain?.name).toBe("Mid C");
    expect(result.gameweeks[0].optimalXi).toHaveLength(11);
    expect(result.gameweeks[0].optimalBench).toHaveLength(4);
    expect(result.gameweeks[1].chip).toBe("3xc");
    expect(result.gameweeks[1].actualCaptain?.name).toBe("Fwd A");
    expect(result.gameweeks[1].optimalCaptain?.name).toBe("Fwd A");
    expect(progress).toContain("Done");
  });

  it("rejects non-numeric Team IDs before fetching", async () => {
    await expect(analyzeSeason("abc", () => undefined, mockClient)).rejects.toThrow("numeric FPL Team ID");
  });
});
