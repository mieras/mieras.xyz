/**
 * GSAP leave/enter hooks for Astro <ClientRouter /> (laag 3, TRANSITIONS.md).
 * Leave runs while the next page loads; enter runs after the swap.
 * Returning the tween lets the router wait until the animation finishes.
 */
import gsap from "gsap";
import { onLeave, onEnter } from "./page-transitions";
import type Lenis from "lenis";

onLeave(({ container }) => {
    const lenis = (window as unknown as { lenis?: Lenis }).lenis;
    lenis?.stop();
    if (!container) return;
    return gsap.to(container, {
        autoAlpha: 0,
        y: -24,
        duration: 0.35,
        ease: "power2.in",
    });
});

onEnter(({ container, type }) => {
    if (!container) return;
    return gsap.from(container, {
        autoAlpha: 0,
        y: 24,
        duration: type === "initial" ? 0.6 : 0.45,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility",
    });
});
