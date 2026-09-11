"use client";

import { useEffect, type RefObject } from "react";

import {
  APPLICANTS,
  NODES,
  ORBIT,
  ROUTES,
  STATUS_LABEL,
  STORY_CYCLE,
  STORY_START_DELAY,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  sampleStory,
  type NodeId,
  type RouteId,
  type StoryFrame,
} from "./scene";

interface HeroSceneOptions {
  /** Enables cursor parallax and node proximity (desktop only). */
  interactive: boolean;
  /** The token card flips to the left of its anchor past this scene x. */
  flipCardPastX: number;
}

/** Time in the story at which the reduced-motion still frame is taken. */
const STATIC_FRAME_TIME = 13.3;

/** Cursor-driven parallax budget in px; layers multiply this by their depth. */
const PARALLAX_PX = 10;

/** Scene-space radius within which a node responds to the cursor. */
const PROXIMITY_RADIUS = 80;

const ROUTE_IDS = Object.keys(ROUTES) as RouteId[];
const NODE_IDS = Object.keys(NODES) as NodeId[];

/**
 * Drives the hero visual from a single requestAnimationFrame loop.
 *
 * The loop samples the pure story timeline, positions the token along the
 * SVG routes with `getPointAtLength`, and writes a handful of attributes and
 * CSS custom properties directly to the DOM. React state is never touched
 * after mount, so cursor movement and the 16s loop cost no re-renders.
 *
 * It also:
 *  - pauses while the scene is off-screen or hidden (IntersectionObserver),
 *  - respects `prefers-reduced-motion` by rendering one resolved still frame,
 *  - degrades to that still frame in environments without SVG geometry APIs
 *    (jsdom in tests).
 */
export function useHeroScene(
  rootRef: RefObject<HTMLDivElement | null>,
  options: HeroSceneOptions,
) {
  const { interactive, flipCardPastX } = options;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const find = <T extends Element>(name: string) =>
      root.querySelector<T>(`[data-el="${name}"]`);

    const token = find<SVGGElement>("token");
    const tokenName = find<SVGTextElement>("token-name");
    const tokenStatus = find<SVGTextElement>("token-status");
    const core = find<SVGGElement>("core");
    const goldRing = find<SVGCircleElement>("gold-ring");
    const goldRing2 = find<SVGCircleElement>("gold-ring-2");
    const score = find<SVGTextElement>("score");
    const reviewDots = find<SVGGElement>("review-dots");
    const orbit = find<SVGPathElement>("orbit");
    const orbitGlow = find<SVGPathElement>("orbit-glow");
    const orbitDot = find<SVGCircleElement>("orbit-dot");
    if (
      !token ||
      !tokenName ||
      !tokenStatus ||
      !core ||
      !goldRing ||
      !score ||
      !reviewDots ||
      !orbit ||
      !orbitGlow ||
      !orbitDot
    ) {
      return;
    }

    const routes = {} as Record<
      RouteId,
      { base: SVGPathElement; glow: SVGPathElement; length: number }
    >;
    for (const id of ROUTE_IDS) {
      const base = find<SVGPathElement>(`route-${id}`);
      const glow = find<SVGPathElement>(`glow-${id}`);
      if (!base || !glow) return;
      routes[id] = { base, glow, length: 0 };
    }

    const nodes = {} as Record<NodeId, SVGGElement>;
    for (const id of NODE_IDS) {
      const el = id === "core" ? core : find<SVGGElement>(`node-${id}`);
      if (!el) return;
      nodes[id] = el;
    }

    const palaceLit = [0, 1, 2, 3]
      .map((i) => find<SVGPathElement>(`palace-lit-${i}`))
      .filter((el): el is SVGPathElement => el !== null);

    // jsdom (and very old browsers) lack SVG geometry; show the still frame.
    const hasGeometry = typeof orbit.getTotalLength === "function";
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let orbitLength = 1;
    if (hasGeometry) {
      orbitLength = orbit.getTotalLength();
      for (const id of ROUTE_IDS)
        routes[id].length = routes[id].base.getTotalLength();
    }

    // -----------------------------------------------------------------------
    // Frame application
    // -----------------------------------------------------------------------

    let lastStatus = "";
    let lastSide = "";
    let lastApplicant = -1;
    let lastScore = -1;
    let lastDots = -1;

    const setVar = (el: Element, name: string, value: number) =>
      (el as HTMLElement).style.setProperty(name, value.toFixed(3));

    const applyFrame = (frame: StoryFrame, applicantIndex: number) => {
      const applicant = APPLICANTS[applicantIndex % APPLICANTS.length];

      // Token position: along a route, or parked at its anchor node.
      let x: number;
      let y: number;
      if (frame.route && hasGeometry) {
        const r = routes[frame.route];
        const p = r.base.getPointAtLength(frame.progress * r.length);
        x = p.x;
        y = p.y;
      } else {
        const anchor = frame.route ? ROUTES[frame.route].to : frame.anchor;
        x = NODES[anchor].x;
        y = NODES[anchor].y;
      }
      token.setAttribute(
        "transform",
        `translate(${x.toFixed(2)} ${(y + frame.tokenLift).toFixed(2)})`,
      );
      token.style.opacity = frame.tokenOpacity.toFixed(3);
      const side = x > flipCardPastX ? "left" : "right";
      if (side !== lastSide) {
        lastSide = side;
        token.dataset.side = side;
      }

      // Token copy only changes at beats; avoid touching text every frame.
      if (applicantIndex !== lastApplicant) {
        lastApplicant = applicantIndex;
        tokenName.textContent = applicant.name;
        lastStatus = "";
      }
      if (frame.status !== lastStatus) {
        lastStatus = frame.status;
        token.dataset.status = frame.status;
        tokenStatus.textContent =
          frame.status === "hacker"
            ? applicant.role
            : STATUS_LABEL[frame.status];
      }

      // Route brightness + the trailing highlight behind the token.
      for (const id of ROUTE_IDS) {
        const r = routes[id];
        setVar(r.base, "--active", frame.routeActive[id]);
        const travelling = frame.route === id;
        r.glow.style.opacity = travelling
          ? (0.9 * frame.routeActive[id]).toFixed(3)
          : "0";
        if (travelling)
          r.glow.style.strokeDashoffset = (0.14 - frame.progress).toFixed(4);
      }

      // Node pulses, core light, gold ring.
      for (const id of NODE_IDS) setVar(nodes[id], "--pulse", frame.pulses[id]);
      setVar(core, "--lit", frame.coreLit);
      // Gold acceptance ring: one thin ring expands, and a fainter echo
      // follows a beat later so it reads as a pulse rather than a flash.
      const ringAt = (
        el: SVGCircleElement | null,
        u: number,
        strength: number,
      ) => {
        if (!el) return;
        if (u <= 0 || u >= 1) {
          el.style.opacity = "0";
          return;
        }
        const eased = 1 - Math.pow(1 - u, 3);
        el.setAttribute("r", (6 + eased * 84).toFixed(2));
        el.style.opacity = (strength * (1 - u) * (1 - u)).toFixed(3);
      };
      ringAt(goldRing, frame.ring, 0.85);
      ringAt(goldRing2, frame.ring < 0 ? 0 : (frame.ring - 0.22) / 0.78, 0.45);

      // Review readout.
      const shownScore =
        frame.reviewDots > 0 || frame.score > 0 ? frame.score : -1;
      if (shownScore !== lastScore) {
        lastScore = shownScore;
        score.textContent = shownScore < 0 ? "— / 10" : `${shownScore} / 10`;
      }
      if (frame.reviewDots !== lastDots) {
        lastDots = frame.reviewDots;
        reviewDots.dataset.review = String(frame.reviewDots);
      }

      // Palace linework lighting sweep.
      palaceLit.forEach((el, i) => {
        const v = frame.palaceLit[i];
        el.style.opacity = (v * 0.75).toFixed(3);
        el.style.strokeDasharray = "1 1";
        el.style.strokeDashoffset = (1 - Math.min(1, v * 1.4)).toFixed(3);
      });
    };

    const applyOrbit = (seconds: number) => {
      if (!hasGeometry) return;
      const u = (seconds / ORBIT.period) % 1;
      const p = orbit.getPointAtLength(u * orbitLength);
      orbitDot.setAttribute("cx", p.x.toFixed(2));
      orbitDot.setAttribute("cy", p.y.toFixed(2));
      orbitGlow.style.strokeDashoffset = (0.14 - u).toFixed(4);
    };

    // -----------------------------------------------------------------------
    // Static path (reduced motion / no geometry)
    // -----------------------------------------------------------------------

    if (reduceMotion || !hasGeometry) {
      root.dataset.static = "true";
      applyFrame(sampleStory(STATIC_FRAME_TIME, APPLICANTS[0].score), 0);
      applyOrbit(ORBIT.period * 0.62);
      return;
    }

    // -----------------------------------------------------------------------
    // Animated path
    // -----------------------------------------------------------------------

    let rafId = 0;
    let running = false;
    let visible = true;
    const startedAt = performance.now();

    // Cursor parallax + proximity state (targets set on input, eased per frame).
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let pointerScene: { x: number; y: number } | null = null;
    let rect = root.getBoundingClientRect();
    const near: Record<NodeId, number> = {
      hacker: 0,
      intake: 0,
      core: 0,
      review: 0,
    };

    const tick = (now: number) => {
      if (!running) return;
      const elapsed = (now - startedAt) / 1000;
      const storyTime = elapsed - STORY_START_DELAY;

      if (storyTime >= 0) {
        const cycle = Math.floor(storyTime / STORY_CYCLE);
        const applicant = APPLICANTS[cycle % APPLICANTS.length];
        applyFrame(sampleStory(storyTime, applicant.score), cycle);
      }
      applyOrbit(elapsed);

      if (interactive) {
        // Critically damped-ish lerp: smooth, no overshoot, no jitter.
        currentX += (targetX - currentX) * 0.07;
        currentY += (targetY - currentY) * 0.07;
        root.style.setProperty(
          "--px",
          `${(currentX * PARALLAX_PX).toFixed(2)}px`,
        );
        root.style.setProperty(
          "--py",
          `${(currentY * PARALLAX_PX).toFixed(2)}px`,
        );

        for (const id of NODE_IDS) {
          let target = 0;
          if (pointerScene) {
            const dx = pointerScene.x - NODES[id].x;
            const dy = pointerScene.y - NODES[id].y;
            const d = Math.hypot(dx, dy);
            target = d < PROXIMITY_RADIUS ? 1 - d / PROXIMITY_RADIUS : 0;
          }
          near[id] += (target - near[id]) * 0.12;
          setVar(nodes[id], "--near", near[id]);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
    const syncRunning = () => {
      if (visible && document.visibilityState !== "hidden") start();
      else stop();
    };

    // Only animate while on screen (also covers the display:none variant).
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              visible = entries.some((e) => e.isIntersecting);
              syncRunning();
            },
            { threshold: 0.05 },
          )
        : null;
    io?.observe(root);
    if (!io) start();

    const onVisibility = () => syncRunning();
    document.addEventListener("visibilitychange", onVisibility);

    const measure = () => {
      rect = root.getBoundingClientRect();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      // Parallax is relative to the scene centre and clamped so distant
      // cursor positions don't over-rotate the composition.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = Math.max(
        -1,
        Math.min(1, (event.clientX - cx) / (rect.width * 0.9)),
      );
      targetY = Math.max(
        -1,
        Math.min(1, (event.clientY - cy) / (rect.height * 0.9)),
      );
      pointerScene = {
        x: ((event.clientX - rect.left) / rect.width) * SCENE_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * SCENE_HEIGHT,
      };
    };
    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      pointerScene = null;
    };

    if (interactive) {
      measure();
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", measure, { passive: true });
      window.addEventListener("scroll", measure, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (interactive) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure);
        document.documentElement.removeEventListener(
          "pointerleave",
          onPointerLeave,
        );
      }
    };
  }, [rootRef, interactive, flipCardPastX]);
}
