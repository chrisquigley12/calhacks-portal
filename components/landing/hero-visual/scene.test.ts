import { describe, expect, it } from "vitest";

import {
  BEATS,
  NODES,
  ROUTES,
  STORY_CYCLE,
  sampleStory,
  type StoryFrame,
} from "./scene";

const mid = ([start, end]: readonly [number, number]) => (start + end) / 2;

describe("sampleStory", () => {
  it("walks an application through the full lifecycle in order", () => {
    const statuses: StoryFrame["status"][] = [];
    for (let t = 0; t < STORY_CYCLE; t += 0.1) {
      const { status } = sampleStory(t);
      if (statuses[statuses.length - 1] !== status) statuses.push(status);
    }
    expect(statuses).toEqual([
      "hacker",
      "submitted",
      "in-review",
      "complete",
      "accepted",
    ]);
  });

  it("travels each route in story order and parks at the right node between them", () => {
    expect(sampleStory(mid(BEATS.spawn))).toMatchObject({
      route: null,
      anchor: "hacker",
    });
    expect(sampleStory(mid(BEATS.toIntake)).route).toBe("toIntake");
    expect(sampleStory(mid(BEATS.submitted))).toMatchObject({
      route: null,
      anchor: "intake",
    });
    expect(sampleStory(mid(BEATS.toCore)).route).toBe("toCore");
    expect(sampleStory(mid(BEATS.toReview)).route).toBe("toReview");
    expect(sampleStory(mid(BEATS.review))).toMatchObject({
      route: null,
      anchor: "review",
    });
    expect(sampleStory(mid(BEATS.toDecision)).route).toBe("toDecision");
    expect(sampleStory(mid(BEATS.accepted))).toMatchObject({
      route: null,
      anchor: "core",
    });
  });

  it("keeps route progress monotonic and bounded while travelling", () => {
    for (const key of [
      "toIntake",
      "toCore",
      "toReview",
      "toDecision",
    ] as const) {
      const [start, end] = BEATS[key];
      let previous = -1;
      const steps = Math.floor((end - start) / 0.05);
      for (let step = 0; step < steps; step += 1) {
        const { progress } = sampleStory(start + step * 0.05);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
        expect(progress).toBeGreaterThanOrEqual(previous);
        previous = progress;
      }
    }
  });

  it("resolves the score to the target during review and clears it on reset", () => {
    expect(sampleStory(BEATS.review[0] + 1.3, 8).score).toBe(8);
    expect(sampleStory(BEATS.review[0] + 1.3, 8).reviewDots).toBe(3);
    expect(sampleStory(mid(BEATS.reset), 8).score).toBe(0);
    expect(sampleStory(mid(BEATS.reset), 8).reviewDots).toBe(0);
  });

  it("fires the gold ring and core light only at the accepted moment", () => {
    const before = sampleStory(mid(BEATS.review));
    const moment = sampleStory(BEATS.accepted[0] + 0.4);
    expect(before.ring).toBe(-1);
    expect(moment.ring).toBeGreaterThan(0);
    expect(moment.ring).toBeLessThan(1);
    expect(moment.coreLit).toBe(1);
  });

  it("fades the token out before the loop restarts so the reset is seamless", () => {
    expect(sampleStory(BEATS.accepted[1] - 0.01).tokenOpacity).toBeLessThan(
      0.05,
    );
    expect(sampleStory(mid(BEATS.reset)).tokenOpacity).toBe(0);
    expect(sampleStory(STORY_CYCLE).status).toBe("hacker");
  });

  it("chains routes so each one starts where the previous ended", () => {
    expect(ROUTES.toIntake.to).toBe(ROUTES.toCore.from);
    expect(ROUTES.toCore.to).toBe(ROUTES.toReview.from);
    expect(ROUTES.toReview.to).toBe(ROUTES.toDecision.from);
    for (const route of Object.values(ROUTES)) {
      const [sx, sy] = route.d
        .match(/^M(\S+) (\S+)/)!
        .slice(1)
        .map(Number);
      const [ex, ey] = route.d.trim().split(" ").slice(-2).map(Number);
      expect({ x: sx, y: sy }).toEqual(NODES[route.from]);
      expect({ x: ex, y: ey }).toEqual(NODES[route.to]);
    }
  });
});
