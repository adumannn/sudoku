import { describe, it, expect } from "vitest";
import { computeDailySnapshot, computeCityCounts, computeUserStanding } from "@/lib/stats/leaderboard";

describe("computeDailySnapshot", () => {
  it("returns nulls when no submissions exist", () => {
    const snap = computeDailySnapshot({
      seq: 472,
      results: [],
      activeGamesCount: 0,
    });
    expect(snap).toEqual({
      seq: 472,
      firstSolve: null,
      median: null,
      solvingNow: 0,
      totalSubmitted: 0,
    });
  });

  it("computes first solve, median, and totalSubmitted for one row", () => {
    const snap = computeDailySnapshot({
      seq: 472,
      results: [
        { user_id: "u1", username: "nurali", elapsed_seconds: 168, city: "almaty", created_at: "2026-05-09T05:00:00Z" },
      ],
      activeGamesCount: 7,
    });
    expect(snap.seq).toBe(472);
    expect(snap.firstSolve).toEqual({ username: "nurali", city: "almaty", elapsedSeconds: 168 });
    expect(snap.median).toBe(168);
    expect(snap.solvingNow).toBe(7);
    expect(snap.totalSubmitted).toBe(1);
  });

  it("first solve is the min elapsed; median is percentile_cont(0.5)", () => {
    const snap = computeDailySnapshot({
      seq: 472,
      results: [
        { user_id: "u1", username: "a", elapsed_seconds: 200, city: "x", created_at: "t" },
        { user_id: "u2", username: "b", elapsed_seconds: 100, city: "y", created_at: "t" },
        { user_id: "u3", username: "c", elapsed_seconds: 300, city: "z", created_at: "t" },
      ],
      activeGamesCount: 0,
    });
    expect(snap.firstSolve?.username).toBe("b");
    expect(snap.median).toBe(200); // middle of [100,200,300]
  });

  it("median averages middle two when count is even", () => {
    const snap = computeDailySnapshot({
      seq: 1,
      results: [
        { user_id: "u1", username: "a", elapsed_seconds: 100, city: "x", created_at: "t" },
        { user_id: "u2", username: "b", elapsed_seconds: 200, city: "x", created_at: "t" },
        { user_id: "u3", username: "c", elapsed_seconds: 300, city: "x", created_at: "t" },
        { user_id: "u4", username: "d", elapsed_seconds: 400, city: "x", created_at: "t" },
      ],
      activeGamesCount: 0,
    });
    expect(snap.median).toBe(250); // avg of 200,300
  });

  it("ties at min — earlier created_at wins", () => {
    const snap = computeDailySnapshot({
      seq: 1,
      results: [
        { user_id: "u1", username: "later", elapsed_seconds: 150, city: "x", created_at: "2026-05-09T08:00:00Z" },
        { user_id: "u2", username: "earlier", elapsed_seconds: 150, city: "x", created_at: "2026-05-09T05:00:00Z" },
      ],
      activeGamesCount: 0,
    });
    expect(snap.firstSolve?.username).toBe("earlier");
  });
});

describe("computeCityCounts", () => {
  it("returns user's city alone when there are no results", () => {
    const out = computeCityCounts({
      rows: [],
      userCity: "almaty",
    });
    expect(out).toEqual([{ city: "almaty", count: 0 }]);
  });

  it("returns empty when no results and no user city", () => {
    expect(computeCityCounts({ rows: [], userCity: null })).toEqual([]);
  });

  it("groups by lowercase-trim, sorted by count descending", () => {
    const out = computeCityCounts({
      rows: [
        { city: "Almaty" },
        { city: "almaty " },
        { city: "Astana" },
        { city: null },
      ],
      userCity: null,
    });
    expect(out).toEqual([
      { city: "almaty", count: 2 },
      { city: "astana", count: 1 },
    ]);
  });

  it("user's city is appended with count 0 if absent from rows", () => {
    const out = computeCityCounts({
      rows: [{ city: "Astana" }],
      userCity: "almaty",
    });
    expect(out).toEqual([
      { city: "astana", count: 1 },
      { city: "almaty", count: 0 },
    ]);
  });

  it("user's city stays in the sorted list when it has results", () => {
    const out = computeCityCounts({
      rows: [
        { city: "Almaty" },
        { city: "Almaty" },
        { city: "Astana" },
      ],
      userCity: "almaty",
    });
    expect(out).toEqual([
      { city: "almaty", count: 2 },
      { city: "astana", count: 1 },
    ]);
  });
});

describe("computeUserStanding", () => {
  it("returns null when user has no row", () => {
    const out = computeUserStanding({
      userRow: null,
      cityResults: [],
    });
    expect(out).toBeNull();
  });

  it("rank=1, percentile=100 when user is the sole solver", () => {
    const out = computeUserStanding({
      userRow: { elapsed_seconds: 200, city: "almaty" },
      cityResults: [{ elapsed_seconds: 200 }],
    });
    expect(out).toEqual({
      time: 200,
      city: "almaty",
      rankInCity: 1,
      citySize: 1,
      percentile: 100,
    });
  });

  it("rank reflects how many users were strictly faster", () => {
    const out = computeUserStanding({
      userRow: { elapsed_seconds: 250, city: "almaty" },
      cityResults: [
        { elapsed_seconds: 100 },
        { elapsed_seconds: 200 },
        { elapsed_seconds: 250 },
        { elapsed_seconds: 300 },
      ],
    });
    expect(out?.rankInCity).toBe(3);
    expect(out?.citySize).toBe(4);
    expect(out?.percentile).toBe(25); // round(100 * (1 - 3/4))
  });

  it("ties — same time as user counts as user's tier, percentile reflects rank position", () => {
    const out = computeUserStanding({
      userRow: { elapsed_seconds: 200, city: "almaty" },
      cityResults: [
        { elapsed_seconds: 200 },
        { elapsed_seconds: 200 },
        { elapsed_seconds: 300 },
      ],
    });
    // rankInCity = 1 + count(strictly faster) = 1 + 0 = 1
    expect(out?.rankInCity).toBe(1);
    expect(out?.citySize).toBe(3);
    expect(out?.percentile).toBe(67); // round(100 * (1 - 1/3))
  });

  it("user with null city gets null city back", () => {
    const out = computeUserStanding({
      userRow: { elapsed_seconds: 200, city: null },
      cityResults: [{ elapsed_seconds: 200 }],
    });
    expect(out?.city).toBeNull();
  });
});
