"use client";

import { useId, useRef } from "react";

import { cn } from "@/lib/utils";

import { AtmosphereLayer, ForegroundLayer } from "./ambient-layers";
import styles from "./hero-visual.module.css";
import { PalaceLayer } from "./palace-layer";
import { COMPACT_VIEWBOX, FLIP_X, FULL_VIEWBOX } from "./scene";
import { SystemLayer } from "./system-layer";
import { useHeroScene } from "./use-hero-scene";

interface CalHacksHeroVisualProps {
  /**
   * "full" is the desktop composition with cursor parallax and every depth
   * layer. "compact" drops the foreground plane, reflection and grid, and
   * disables pointer interaction for small screens.
   */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * "The Cal Hacks Portal": an abstract wireframe of the Palace of Fine Arts
 * rotunda with the application workflow flowing through it. Four stacked
 * depth planes (atmosphere → palace → system → foreground), each with its own
 * parallax coefficient, and a 16-second story loop in which one application
 * is submitted, reviewed, scored and accepted.
 *
 * Purely decorative: the whole thing is `aria-hidden` and the hero copy
 * carries the meaning.
 */
export function CalHacksHeroVisual({
  variant = "full",
  className,
}: CalHacksHeroVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Unique per instance so SVG ids don't collide when both variants render.
  const uid = `hv${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const viewBox = variant === "compact" ? COMPACT_VIEWBOX : FULL_VIEWBOX;

  useHeroScene(rootRef, {
    interactive: variant === "full",
    flipCardPastX: FLIP_X[variant],
  });

  return (
    <div
      ref={rootRef}
      className={cn(
        styles.scene,
        variant === "compact" && styles.compact,
        className,
      )}
      aria-hidden="true"
      data-testid="hero-visual"
    >
      <AtmosphereLayer uid={uid} viewBox={viewBox} />
      <PalaceLayer uid={uid} viewBox={viewBox} />
      <SystemLayer uid={uid} viewBox={viewBox} />
      <ForegroundLayer uid={uid} viewBox={viewBox} />
    </div>
  );
}
