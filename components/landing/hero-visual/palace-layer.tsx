import type { CSSProperties } from "react";

import styles from "./hero-visual.module.css";
import type { LayerProps } from "./types";
import { SCENE_WIDTH } from "./scene";

/**
 * Abstract wireframe of the Palace of Fine Arts rotunda (the Cal Hacks 13.0
 * venue): a low dome on a drum, the tall central arch with a second arch
 * visible through it, paired columns, and the two curved colonnade wings.
 * Below the ground line the whole structure is mirrored into the lagoon.
 *
 * Each path carries `pathLength={1}` so the CSS draw-in animation can use a
 * dash of length 1 regardless of the path's real length. `--i` staggers the
 * order in which lines appear: ground first, dome last.
 */

interface Stroke {
  d: string;
  /** Draw-order group (0 = first). */
  i: number;
  /** Line opacity; distant/secondary geometry sits lower. */
  o: number;
}

const GROUND_Y = 396;

const columns = (
  xs: number[],
  top: number,
  bottom: number,
  i: number,
  o: number,
): Stroke[] =>
  xs.flatMap((x) => [
    { d: `M${x} ${top} V${bottom}`, i, o },
    // Capital: a short tick just under the entablature.
    { d: `M${x - 3} ${top + 4} H${x + 3}`, i, o: o * 0.8 },
  ]);

const STROKES: Stroke[] = [
  // Ground / plinth
  { d: `M110 ${GROUND_Y} H550`, i: 0, o: 0.52 },
  { d: `M262 ${GROUND_Y - 6} H398`, i: 0, o: 0.29 },
  { d: `M252 ${GROUND_Y + 6} H408`, i: 1, o: 0.18 },

  // Left colonnade wing: entablature + paired columns (no arches on the wings).
  { d: "M118 300 H234", i: 1, o: 0.46 },
  { d: "M122 309 H230", i: 1, o: 0.26 },
  ...columns([132, 144, 176, 188, 214, 226], 314, GROUND_Y, 2, 0.33),

  // Right colonnade wing
  { d: "M426 300 H542", i: 1, o: 0.46 },
  { d: "M430 309 H538", i: 1, o: 0.26 },
  ...columns([434, 446, 472, 484, 516, 528], 314, GROUND_Y, 2, 0.33),

  // Rotunda drum columns (pairs flanking the central arch)
  ...columns([244, 256, 404, 416], 216, GROUND_Y, 3, 0.55),

  // Entablature (double line) and drum band
  { d: "M234 196 H426", i: 4, o: 0.62 },
  { d: "M238 206 H422", i: 4, o: 0.4 },
  { d: "M240 216 H420", i: 4, o: 0.18 },

  // Back arch, seen through the rotunda
  {
    d: `M300 ${GROUND_Y} V318 A30 30 0 0 1 360 318 V${GROUND_Y}`,
    i: 5,
    o: 0.18,
  },

  // Central arch: outer and inner line
  {
    d: `M272 ${GROUND_Y} V304 A58 58 0 0 1 388 304 V${GROUND_Y}`,
    i: 5,
    o: 0.66,
  },
  {
    d: `M282 ${GROUND_Y} V304 A48 48 0 0 1 378 304 V${GROUND_Y}`,
    i: 6,
    o: 0.4,
  },
  // Keystone
  { d: "M326 246 L330 240 L334 246", i: 6, o: 0.46 },

  // Dome
  { d: "M246 196 A84 62 0 0 1 414 196", i: 7, o: 0.62 },
  { d: "M254 196 A76 54 0 0 1 406 196", i: 7, o: 0.21 },
  // Meridian ribs
  { d: "M330 134 C302 150 278 172 264 196", i: 8, o: 0.28 },
  { d: "M330 134 C358 150 382 172 396 196", i: 8, o: 0.28 },
  { d: "M330 134 C318 152 308 174 304 196", i: 8, o: 0.18 },
  { d: "M330 134 C342 152 352 174 356 196", i: 8, o: 0.18 },
  // Finial
  { d: "M330 134 V126", i: 9, o: 0.46 },
];

/** Paths duplicated in blue and lit sequentially when an application enters. */
export const LIT_PATHS = [
  "M118 300 H234 M132 314 V396 M226 314 V396", // wing
  `M272 ${GROUND_Y} V304 A58 58 0 0 1 388 304 V${GROUND_Y}`, // arch
  `M282 ${GROUND_Y} V304 A48 48 0 0 1 378 304 V${GROUND_Y}`, // inner arch
  "M246 196 A84 62 0 0 1 414 196", // dome
];

const RIPPLES = [
  { d: "M170 418 H490", o: 0.13 },
  { d: "M210 434 H450", o: 0.09 },
  { d: "M250 452 H410", o: 0.07 },
];

export function PalaceLayer({ uid, viewBox }: LayerProps) {
  const gradientId = `${uid}-reflection-fade`;
  const maskId = `${uid}-reflection-mask`;
  const palaceId = `${uid}-palace`;
  return (
    <div className={`${styles.layer} ${styles.palace}`} aria-hidden="true">
      <svg viewBox={viewBox} fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.8" />
            <stop offset="0.55" stopColor="white" stopOpacity="0.18" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y={GROUND_Y}
            width={SCENE_WIDTH}
            height="160"
          >
            <rect
              x="0"
              y={GROUND_Y}
              width={SCENE_WIDTH}
              height="160"
              fill={`url(#${gradientId})`}
            />
          </mask>
        </defs>

        <g className={styles.palaceBreath}>
          <g id={palaceId}>
            {STROKES.map((s, index) => (
              <path
                key={index}
                className={`${styles.line} ${styles.palaceLine}`}
                d={s.d}
                pathLength={1}
                style={{ "--i": s.i, opacity: s.o } as CSSProperties}
              />
            ))}
          </g>

          {/* Sequentially lit duplicates, driven by the story timeline. */}
          {LIT_PATHS.map((d, index) => (
            <path
              key={index}
              data-el={`palace-lit-${index}`}
              className={`${styles.line} ${styles.palaceLit}`}
              d={d}
              pathLength={1}
            />
          ))}

          {/* Lagoon reflection: mirrored about the ground line and faded out. */}
          <g className={styles.reflection} mask={`url(#${maskId})`}>
            <use
              href={`#${palaceId}`}
              transform={`translate(0 ${GROUND_Y * 2}) scale(1 -1)`}
              opacity="0.42"
            />
            {RIPPLES.map((r) => (
              <path key={r.d} className={styles.line} d={r.d} opacity={r.o} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
