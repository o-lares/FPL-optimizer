import { describe, expect, it } from "vitest";
import { findOptimalLineup, isValidFormation } from "../lib/optimizer";
import type { PositionId } from "../lib/types";

const positions: Record<number, PositionId> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  7: 2,
  8: 3,
  9: 3,
  10: 3,
  11: 3,
  12: 3,
  13: 4,
  14: 4,
  15: 4,
};

const squad = Array.from({ length: 15 }, (_, index) => index + 1);

describe("isValidFormation", () => {
  it("accepts valid FPL formations", () => {
    expect(isValidFormation([1, 3, 4, 5, 8, 9, 10, 11, 13, 14, 15], positions)).toBe(true);
    expect(isValidFormation([1, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14], positions)).toBe(true);
  });

  it("rejects invalid FPL formations", () => {
    expect(isValidFormation([1, 2, 3, 4, 5, 8, 9, 10, 11, 13, 14], positions)).toBe(false);
    expect(isValidFormation([1, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15], positions)).toBe(false);
    expect(isValidFormation([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], positions)).toBe(false);
  });
});

describe("findOptimalLineup", () => {
  it("finds the best normal lineup and doubles the captain", () => {
    const scores = {
      1: 3,
      2: 10,
      3: 2,
      4: 6,
      5: 5,
      6: 1,
      7: 0,
      8: 8,
      9: 7,
      10: 13,
      11: 4,
      12: 1,
      13: 9,
      14: 3,
      15: 0,
    };

    const result = findOptimalLineup(squad, scores, positions, null);

    expect(result.captainId).toBe(10);
    expect(result.startingIds).toHaveLength(11);
    expect(result.benchIds).toHaveLength(4);
    expect(result.points).toBe(81);
  });

  it("uses a 3x multiplier for Triple Captain", () => {
    const scores = Object.fromEntries(squad.map((id) => [id, 1]));
    scores[8] = 11;

    const result = findOptimalLineup(squad, scores, positions, "3xc");

    expect(result.captainId).toBe(8);
    expect(result.points).toBe(43);
  });

  it("counts all 15 players and still applies captain bonus on Bench Boost", () => {
    const scores = Object.fromEntries(squad.map((id) => [id, 2]));
    scores[2] = 15;

    const result = findOptimalLineup(squad, scores, positions, "bboost");

    expect(result.captainId).toBe(2);
    expect(result.points).toBe(58);
    expect(result.startingIds).toContain(2);
    expect(result.benchIds).toHaveLength(4);
  });

  it("treats missing scores as zero", () => {
    const result = findOptimalLineup(squad, { 8: 9 }, positions, null);

    expect(result.captainId).toBe(8);
    expect(result.points).toBe(18);
  });

  it("keeps captain ties deterministic by squad order", () => {
    const scores = Object.fromEntries(squad.map((id) => [id, 0]));
    scores[8] = 12;
    scores[9] = 12;

    const result = findOptimalLineup(squad, scores, positions, null);

    expect(result.captainId).toBe(8);
  });
});
