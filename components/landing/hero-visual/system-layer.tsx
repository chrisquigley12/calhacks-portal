import type { CSSProperties } from "react";

import styles from "./hero-visual.module.css";
import type { LayerProps } from "./types";
import {
  APPLICANTS,
  INNER_ORBIT,
  NODES,
  ORBIT,
  ROUTES,
  type NodeId,
  type RouteId,
} from "./scene";

/**
 * The "application system": orbits, routes, the four nodes, the Cal Hacks
 * core, and the travelling application token. Everything that moves during
 * the story is addressed by a `data-el` attribute so the scene hook can find
 * it once and write to it directly each frame.
 */

const ROUTE_IDS = Object.keys(ROUTES) as RouteId[];

/** Points along the outer orbit (before rotation) that read as junctions. */
const ORBIT_TICKS = [60, 200, 290].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: ORBIT.cx + ORBIT.rx * Math.cos(rad),
    y: ORBIT.cy + ORBIT.ry * Math.sin(rad),
  };
});

interface NodeSpec {
  id: NodeId;
  label: string;
  detail: string;
  /** Label anchor relative to the node. */
  dx: number;
  dy: number;
  anchor?: "start" | "middle" | "end";
  tone?: "ink" | "blue";
  i: number;
}

const NODE_SPECS: NodeSpec[] = [
  {
    id: "hacker",
    label: "Hacker · Volunteer",
    detail: "applications · fall '26",
    dx: -8,
    dy: 22,
    i: 0,
  },
  {
    id: "intake",
    label: "Submission intake",
    detail: "submitted → review queue",
    dx: -10,
    dy: 24,
    i: 1,
  },
  {
    id: "review",
    label: "Organizer review",
    detail: "score 1 – 10 · organizer notes",
    dx: -34,
    dy: 26,
    i: 2,
  },
];

function Node({ spec }: { spec: NodeSpec }) {
  const p = NODES[spec.id];
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      {/* Position lives on the parent: CSS entrance transforms would otherwise
          override an SVG `transform` attribute on the same element. */}
      <g
        className={styles.node}
        data-el={`node-${spec.id}`}
        style={{ "--i": spec.i } as CSSProperties}
      >
        <circle className={styles.nodeRing} r="8" />
        <circle
          className={styles.nodeDot}
          r="2.6"
          data-tone={spec.tone ?? "ink"}
        />
        <text
          className={`${styles.mono} ${styles.nodeLabel}`}
          x={spec.dx}
          y={spec.dy}
          textAnchor={spec.anchor}
        >
          {spec.label}
        </text>
        <text
          className={`${styles.mono} ${styles.nodeDetail}`}
          x={spec.dx}
          y={spec.dy + (spec.id === "review" ? 22 : 11)}
          textAnchor={spec.anchor}
          style={{ fontSize: "7px" }}
        >
          {spec.detail}
        </text>
        {spec.id === "review" && (
          <>
            <text
              className={styles.mono}
              data-el="score"
              x={spec.dx}
              y={spec.dy + 11}
              opacity="0.9"
            >
              — / 10
            </text>
            <g
              data-el="review-dots"
              data-review="0"
              transform={`translate(${spec.dx + 40} ${spec.dy + 8})`}
            >
              <circle className={styles.reviewDot} cx="0" r="1.8" />
              <circle className={styles.reviewDot} cx="7" r="1.8" />
              <circle className={styles.reviewDot} cx="14" r="1.8" />
            </g>
          </>
        )}
      </g>
    </g>
  );
}

function Core({ uid }: { uid: string }) {
  const p = NODES.core;
  const pearlId = `${uid}-pearl`;
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <g className={styles.core} data-el="core">
        <defs>
          <radialGradient id={pearlId} cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor="white" />
            <stop offset="0.55" stopColor="hsl(var(--muted))" />
            <stop offset="1" stopColor="hsl(var(--input))" />
          </radialGradient>
        </defs>
        <circle className={styles.pearlGlow} r="24" />
        <circle className={styles.pearlHalo} r="11" />
        <circle className={styles.goldRing} data-el="gold-ring" r="6" />
        <circle className={styles.goldRing} data-el="gold-ring-2" r="6" />
        <g className={styles.pearl}>
          <circle r="6" fill={`url(#${pearlId})`} />
          <circle
            className={styles.pearlRing}
            r="6"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeOpacity="0.5"
            strokeWidth="0.75"
          />
        </g>
        <text
          className={`${styles.mono} ${styles.nodeLabel} ${styles.coreLabel}`}
          y="26"
          textAnchor="middle"
        >
          Cal Hacks · 13.0
        </text>
        <text
          className={`${styles.mono} ${styles.nodeDetail}`}
          y="38"
          textAnchor="middle"
          style={{ fontSize: "7px" }}
        >
          palace of fine arts · 36h
        </text>
      </g>
    </g>
  );
}

function Token({ uid }: { uid: string }) {
  const shadowId = `${uid}-token-shadow`;
  const first = APPLICANTS[0];
  return (
    <g className={styles.token} data-el="token" data-status="hacker">
      <defs>
        <filter id={shadowId} x="-10%" y="-30%" width="120%" height="180%">
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.6"
            floodColor="hsl(var(--foreground))"
            floodOpacity="0.12"
          />
        </filter>
      </defs>
      <circle className={styles.tokenAnchor} r="2.8" />
      <g className={styles.tokenBody}>
        <path
          className={`${styles.line} ${styles.tokenStem}`}
          d="M3 -3 L9 -9"
          opacity="0.35"
        />
        <g filter={`url(#${shadowId})`}>
          <rect
            className={styles.tokenCard}
            x="9"
            y="-37"
            width="90"
            height="28"
            rx="5"
          />
        </g>
        <text className={styles.tokenName} data-el="token-name" x="17" y="-25">
          {first.name}
        </text>
        <text
          className={styles.tokenStatus}
          data-el="token-status"
          x="17"
          y="-15.5"
        >
          {first.role}
        </text>
        <path
          className={styles.tokenCheck}
          d="M100 -23.5 L103 -20.5 L108.5 -26.5"
          pathLength={1}
        />
        <circle className={styles.tokenAccent} cx="104.5" cy="-23" r="2.4" />
      </g>
    </g>
  );
}

export function SystemLayer({ uid, viewBox }: LayerProps) {
  const orbitId = `${uid}-orbit`;
  return (
    <div className={`${styles.layer} ${styles.system}`} aria-hidden="true">
      <svg viewBox={viewBox} fill="none">
        {/* Outer orbit: the review loop. Rotated as a group so the ambient
            highlight can be positioned in the ellipse's own coordinates. */}
        <g transform={`rotate(${ORBIT.rotate} ${ORBIT.cx} ${ORBIT.cy})`}>
          <path
            id={orbitId}
            data-el="orbit"
            className={`${styles.line} ${styles.orbitLine}`}
            d={ORBIT.d}
            pathLength={1}
            opacity="0.26"
            style={{ "--i": 3 } as CSSProperties}
          />
          <g className={styles.innerOrbit}>
            <path
              data-el="orbit-glow"
              className={`${styles.line} ${styles.routeGlow}`}
              d={ORBIT.d}
              pathLength={1}
              style={{ opacity: 0.55 }}
            />
            <circle data-el="orbit-dot" r="1.8" fill="hsl(var(--primary))" />
          </g>
          {ORBIT_TICKS.map((t, index) => (
            <circle
              key={index}
              cx={t.x}
              cy={t.y}
              r="1.6"
              fill="hsl(var(--foreground))"
              fillOpacity="0.38"
            />
          ))}
          {/* Opacity sits on a wrapper: the entrance animation ends at
              opacity 1 and would override it on the animated element. */}
          <g opacity="0.4">
            <text
              className={`${styles.mono} ${styles.fragment}`}
              style={{ fontSize: "7px", "--i": 5 } as CSSProperties}
            >
              <textPath href={`#${orbitId}`} startOffset="13%">
                build · learn · create
              </textPath>
            </text>
          </g>
        </g>

        {/* Inner orbit: dashed, drifting slowly the other way. */}
        <g
          className={styles.innerOrbit}
          transform={`rotate(${INNER_ORBIT.rotate} ${INNER_ORBIT.cx} ${INNER_ORBIT.cy})`}
        >
          <ellipse
            className={`${styles.line} ${styles.innerOrbitDash}`}
            cx={INNER_ORBIT.cx}
            cy={INNER_ORBIT.cy}
            rx={INNER_ORBIT.rx}
            ry={INNER_ORBIT.ry}
            strokeDasharray="2 7"
            opacity="0.18"
          />
        </g>

        {/* Routes the token travels, with a blue trailing highlight each. */}
        {ROUTE_IDS.map((id, index) => (
          <g key={id}>
            <path
              data-el={`route-${id}`}
              className={`${styles.line} ${styles.routeLine}`}
              d={ROUTES[id].d}
              pathLength={1}
              style={{ "--i": index } as CSSProperties}
            />
            <path
              data-el={`glow-${id}`}
              className={`${styles.line} ${styles.routeGlow}`}
              d={ROUTES[id].d}
              pathLength={1}
            />
          </g>
        ))}

        {/* Intake queue: a few ghost applications waiting their turn. */}
        <g opacity="0.16">
          <g
            className={`${styles.fragment} ${styles.line}`}
            style={{ "--i": 4 } as CSSProperties}
          >
            <rect x="44" y="410" width="26" height="7" rx="1.5" />
            <rect x="49" y="420" width="26" height="7" rx="1.5" />
            <rect x="54" y="430" width="26" height="7" rx="1.5" />
          </g>
        </g>

        {NODE_SPECS.map((spec) => (
          <Node key={spec.id} spec={spec} />
        ))}
        <Core uid={uid} />
        <Token uid={uid} />
      </svg>
    </div>
  );
}
