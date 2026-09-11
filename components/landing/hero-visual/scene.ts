/**
 * Geometry and story timeline for the hero visual.
 *
 * Everything here is pure data or pure functions so the composition can be
 * reasoned about (and unit tested) without a DOM. The hook in
 * `use-hero-scene.ts` samples `sampleStory` every animation frame and writes
 * the result straight to SVG attributes; React never re-renders for motion.
 *
 * Coordinates are in a fixed 640 x 600 SVG space. The SVG scales with its
 * container, so nothing here needs to know about pixels.
 */

export const SCENE_WIDTH = 640;
export const SCENE_HEIGHT = 600;

/** Full desktop framing. */
export const FULL_VIEWBOX = `0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`;
/** Tighter crop for the compact (mobile) variant so the Palace reads larger. */
export const COMPACT_VIEWBOX = "24 96 616 460";

/** Past this scene x the token card flips to the anchor's left to stay in frame. */
export const FLIP_X = { full: 470, compact: 400 } as const;

export type NodeId = "hacker" | "intake" | "core" | "review";
export type RouteId = "toIntake" | "toCore" | "toReview" | "toDecision";

export interface Point {
  x: number;
  y: number;
}

/** Anchor points for the system nodes. Intake and Review sit on the outer orbit. */
export const NODES: Record<NodeId, Point> = {
  hacker: { x: 78, y: 498 },
  intake: { x: 180, y: 429 },
  core: { x: 330, y: 326 },
  review: { x: 526, y: 227 },
};

/** Cubic routes the application token travels, in story order. */
export const ROUTES: Record<RouteId, { d: string; from: NodeId; to: NodeId }> =
  {
    toIntake: {
      d: "M78 498 C110 500 146 462 180 429",
      from: "hacker",
      to: "intake",
    },
    toCore: {
      d: "M180 429 C222 404 286 372 330 326",
      from: "intake",
      to: "core",
    },
    toReview: {
      d: "M330 326 C400 306 484 250 526 227",
      from: "core",
      to: "review",
    },
    toDecision: {
      d: "M526 227 C470 236 388 284 330 326",
      from: "review",
      to: "core",
    },
  };

/** Outer orbit: tilted ellipse around the core. Drawn inside a rotated group. */
export const ORBIT = {
  cx: 330,
  cy: 318,
  rx: 236,
  ry: 118,
  rotate: -10,
  d: "M94 318 A236 118 0 1 1 566 318 A236 118 0 1 1 94 318",
  /** Seconds for the ambient highlight to complete one lap. */
  period: 11,
};

export const INNER_ORBIT = {
  cx: 330,
  cy: 322,
  rx: 150,
  ry: 58,
  rotate: 16,
};

/** Applicants that rotate through the loop so consecutive cycles differ. */
export const APPLICANTS = [
  { name: "Hacker applicant", role: "Application #026", score: 9 },
  { name: "Volunteer applicant", role: "Application #041", score: 8 },
  { name: "Hacker applicant", role: "Application #113", score: 9 },
] as const;

export type TokenStatus =
  "hacker" | "submitted" | "in-review" | "complete" | "accepted";

/** Total length of one story loop, in seconds. */
export const STORY_CYCLE = 16;

/** Delay after mount before the first token appears (entrance choreography). */
export const STORY_START_DELAY = 2;

/**
 * Story beats, in seconds within the cycle. Kept as named constants so the
 * timing can be tuned in one place and the tests can reference the same
 * numbers.
 */
export const BEATS = {
  spawn: [0, 1.2],
  toIntake: [1.2, 4.2],
  submitted: [4.2, 4.9],
  toCore: [4.9, 7.4],
  toReview: [7.4, 9.8],
  review: [9.8, 11.4],
  toDecision: [11.4, 12.4],
  accepted: [12.4, 14.9],
  reset: [14.9, 16],
} as const satisfies Record<string, readonly [number, number]>;

export interface StoryFrame {
  /** Route currently being travelled, or null when parked at a node. */
  route: RouteId | null;
  /** Eased 0..1 progress along `route`. */
  progress: number;
  /** Node the token is parked at when `route` is null. */
  anchor: NodeId;
  tokenOpacity: number;
  /** Vertical offset applied to the token (used for the accepted "rise"). */
  tokenLift: number;
  status: TokenStatus;
  /** Review score currently displayed (0..10). */
  score: number;
  /** How many of the three review indicators are filled (0..3). */
  reviewDots: number;
  /** One-shot pulse envelopes (0..1) per node. */
  pulses: Record<NodeId, number>;
  /** 0..1 how strongly the core is lit blue. */
  coreLit: number;
  /** Gold ring expansion progress 0..1, or -1 when not showing. */
  ring: number;
  /** Sequential lighting of palace linework: wing, arch, inner arch, dome. */
  palaceLit: [number, number, number, number];
  /** 0..1 brightness for each route's base line. */
  routeActive: Record<RouteId, number>;
}

// ---------------------------------------------------------------------------
// Easing helpers
// ---------------------------------------------------------------------------

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number) => t * t * t;

/** Smooth 0→1 over [start, end]. */
export const ramp = (t: number, start: number, end: number) =>
  clamp01((t - start) / (end - start));

/** Half-sine envelope: 0 at `start`, 1 at the midpoint, 0 at `start + dur`. */
export const pulse = (t: number, start: number, dur: number) => {
  const u = (t - start) / dur;
  if (u <= 0 || u >= 1) return 0;
  return Math.sin(u * Math.PI);
};

/** Rises quickly then decays slowly; used for the palace "lighting" sweep. */
const flare = (t: number, start: number, attack: number, decay: number) => {
  if (t < start) return 0;
  if (t < start + attack) return easeOutCubic((t - start) / attack);
  return 1 - easeInOutCubic(clamp01((t - start - attack) / decay));
};

/** 1 while inside [start, end], with soft edges of `fadeIn`/`fadeOut` seconds. */
const hold = (
  t: number,
  start: number,
  end: number,
  fadeIn: number,
  fadeOut: number,
) => Math.min(ramp(t, start - fadeIn, start), 1 - ramp(t, end, end + fadeOut));

// ---------------------------------------------------------------------------
// The story
// ---------------------------------------------------------------------------

/**
 * Samples the application-lifecycle story at time `t` (seconds within one
 * cycle). `scoreTarget` is the score the review resolves to for this loop.
 */
export function sampleStory(t: number, scoreTarget = 9): StoryFrame {
  let time = t % STORY_CYCLE;
  if (time < 0) time += STORY_CYCLE;
  const B = BEATS;

  let route: RouteId | null = null;
  let progress = 0;
  let anchor: NodeId = "hacker";
  let tokenOpacity = 1;
  let tokenLift = 0;
  let status: TokenStatus = "hacker";

  if (time < B.spawn[1]) {
    anchor = "hacker";
    tokenOpacity = easeOutCubic(ramp(time, 0.15, B.spawn[1]));
  } else if (time < B.toIntake[1]) {
    route = "toIntake";
    progress = easeInOutCubic(ramp(time, ...B.toIntake));
  } else if (time < B.submitted[1]) {
    anchor = "intake";
    status = time > B.submitted[0] + 0.08 ? "submitted" : "hacker";
  } else if (time < B.toCore[1]) {
    route = "toCore";
    progress = easeInOutCubic(ramp(time, ...B.toCore));
    status = "submitted";
  } else if (time < B.toReview[1]) {
    route = "toReview";
    progress = easeInOutCubic(ramp(time, ...B.toReview));
    status = time > B.toReview[0] + 0.25 ? "in-review" : "submitted";
  } else if (time < B.review[1]) {
    anchor = "review";
    status = time > B.review[0] + 1.25 ? "complete" : "in-review";
  } else if (time < B.toDecision[1]) {
    route = "toDecision";
    // Accelerating: the decision "shoots" back to the core.
    progress = easeInCubic(ramp(time, ...B.toDecision));
    status = "complete";
  } else if (time < B.accepted[1]) {
    anchor = "core";
    status = time > B.accepted[0] + 0.18 ? "accepted" : "complete";
    const rise = ramp(time, B.accepted[1] - 1.1, B.accepted[1]);
    tokenLift = -16 * easeInCubic(rise);
    tokenOpacity = 1 - easeInCubic(rise);
  } else {
    anchor = "core";
    tokenOpacity = 0;
    status = "accepted";
  }

  // Score resolves during review, easing out so the last digits settle slowly.
  const scoreProgress = easeOutCubic(
    ramp(time, B.review[0] + 0.15, B.review[0] + 1.1),
  );
  const score =
    time >= B.review[0] && time < B.reset[0]
      ? Math.round(scoreProgress * scoreTarget)
      : 0;

  const reviewDots =
    time < B.review[0] || time >= B.reset[0]
      ? 0
      : Math.min(
          3,
          Math.floor(ramp(time, B.review[0] + 0.2, B.review[0] + 1.3) * 3.999),
        );

  const pulses: Record<NodeId, number> = {
    hacker: pulse(time, 0.1, 0.9),
    intake: pulse(time, B.submitted[0], 0.7),
    core: Math.max(
      pulse(time, B.toCore[1] - 0.05, 0.8),
      pulse(time, B.accepted[0], 0.9),
    ),
    review: pulse(time, B.review[0], 0.7),
  };

  const coreLit = Math.max(
    0.55 * pulse(time, B.toCore[1] - 0.1, 1.2),
    hold(time, B.accepted[0], B.accepted[0] + 1.4, 0.15, 1.1),
  );

  const ringWindow = [B.accepted[0] + 0.05, B.accepted[0] + 1.65] as const;
  const ring =
    time >= ringWindow[0] && time < ringWindow[1]
      ? ramp(time, ...ringWindow)
      : -1;

  const litStart = B.toCore[0] + 1.3;
  const palaceLit: [number, number, number, number] = [
    flare(time, litStart, 0.35, 1.6),
    flare(time, litStart + 0.35, 0.35, 1.6),
    flare(time, litStart + 0.7, 0.35, 1.6),
    flare(time, litStart + 1.05, 0.4, 1.8),
  ];

  const routeActive: Record<RouteId, number> = {
    toIntake: hold(time, ...B.toIntake, 0.4, 0.8),
    toCore: hold(time, ...B.toCore, 0.4, 0.8),
    toReview: hold(time, ...B.toReview, 0.4, 0.8),
    toDecision: hold(time, ...B.toDecision, 0.2, 0.9),
  };

  return {
    route,
    progress,
    anchor,
    tokenOpacity,
    tokenLift,
    status,
    score,
    reviewDots,
    pulses,
    coreLit,
    ring,
    palaceLit,
    routeActive,
  };
}

/** Human-readable status line shown on the token for each state. */
export const STATUS_LABEL: Record<TokenStatus, string> = {
  hacker: "", // replaced by the application number
  submitted: "SUBMITTED",
  "in-review": "IN REVIEW",
  complete: "REVIEW COMPLETE",
  accepted: "ACCEPTED",
};
