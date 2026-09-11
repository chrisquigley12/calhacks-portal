import type { CSSProperties } from "react";

import styles from "./hero-visual.module.css";
import type { LayerProps } from "./types";

/**
 * The two "bookend" depth planes: the atmosphere far behind the Palace and
 * a handful of blurred fragments in front of everything. Both are purely
 * decorative and carry the weakest / strongest parallax coefficients so the
 * scene reads as a shallow 3D space rather than a flat drawing.
 */

/** Palace of Fine Arts, San Francisco. */
const COORDINATES = "37.8029° N · 122.4484° W";

export function AtmosphereLayer({ uid, viewBox }: LayerProps) {
  const glowId = `${uid}-glow`;
  const dotsId = `${uid}-dots`;
  return (
    <div className={`${styles.layer} ${styles.atmosphere}`} aria-hidden="true">
      <svg viewBox={viewBox} fill="none">
        <defs>
          <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
            <stop
              offset="0"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.075"
            />
            <stop
              offset="0.55"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.025"
            />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <pattern
            id={dotsId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="1"
              cy="1"
              r="0.7"
              fill="hsl(var(--foreground))"
              fillOpacity="0.2"
            />
          </pattern>
        </defs>

        {/* Soft light behind the rotunda. */}
        <ellipse cx="330" cy="300" rx="320" ry="250" fill={`url(#${glowId})`} />

        {/* Dot-coordinate grid, faded toward the edges by a second gradient. */}
        <g className={styles.dotGrid}>
          <rect
            x="64"
            y="72"
            width="512"
            height="456"
            fill={`url(#${dotsId})`}
          />
        </g>

        {/* Construction lines: a horizon, a centre axis, and edge ticks. */}
        <g className={styles.line} opacity="0.1">
          <path d="M40 396 H600" strokeDasharray="1 5" />
          <path d="M330 60 V560" strokeDasharray="1 5" />
          <path d="M64 72 H76 M64 72 V84" />
          <path d="M576 72 H564 M576 72 V84" />
          <path d="M64 528 H76 M64 528 V516" />
          <path d="M576 528 H564 M576 528 V516" />
        </g>

        {/* Tiny annotations: venue coordinates and the season marker. */}
        <g className={`${styles.mono} ${styles.corner}`} opacity="0.55">
          <text x="576" y="548" textAnchor="end">
            {COORDINATES}
          </text>
          <text x="64" y="62">
            Fall &apos;26
          </text>
          <text x="576" y="62" textAnchor="end">
            Palace of Fine Arts
          </text>
        </g>
      </svg>
    </div>
  );
}

export function ForegroundLayer({ uid, viewBox }: LayerProps) {
  const blurId = `${uid}-fg-blur`;
  const softId = `${uid}-fg-soft`;
  return (
    <div className={`${styles.layer} ${styles.foreground}`} aria-hidden="true">
      <svg viewBox={viewBox} fill="none">
        <defs>
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={softId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* A large arch fragment very close to the camera, clipped by the frame. */}
        <g className={styles.floatB} filter={`url(#${blurId})`}>
          <path
            className={styles.line}
            d="M470 640 V470 A150 150 0 0 1 770 470"
            strokeWidth="1.5"
            opacity="0.09"
          />
          <path
            className={styles.line}
            d="M486 640 V470 A134 134 0 0 1 754 470"
            opacity="0.06"
          />
        </g>

        {/* Blurred nodes drifting at their own pace. */}
        <g className={styles.floatA} filter={`url(#${softId})`}>
          <circle
            cx="92"
            cy="150"
            r="4"
            fill="hsl(var(--foreground))"
            fillOpacity="0.16"
          />
        </g>
        <g className={styles.floatC} filter={`url(#${softId})`}>
          <circle
            cx="592"
            cy="392"
            r="3"
            fill="hsl(var(--primary))"
            fillOpacity="0.28"
          />
        </g>

        {/* Sharp, crisp micro-fragments at the front plane. */}
        <g
          className={styles.floatA}
          style={{ animationDelay: "-3s" } as CSSProperties}
        >
          <text
            className={styles.mono}
            x="560"
            y="132"
            textAnchor="end"
            opacity="0.62"
          >
            36h
          </text>
          <path className={styles.line} d="M566 136 H578" opacity="0.3" />
        </g>
      </svg>
    </div>
  );
}
