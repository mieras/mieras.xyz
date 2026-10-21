/*
  Lichte laag over Astro's <ClientRouter />: voortgangsbalk + hooks voor (GSAP-)animaties.
  Zet in src/lib/page-transitions.ts. Wordt geladen door PageProgress.astro.

  Zonder hooks: Astro doet de (CSS) view transition, wij alleen de balk.
  Met een onLeave-hook: de leave-animatie loopt tegelijk met het ophalen van de
  nieuwe pagina (event.loader), en de native view transition wordt overgeslagen
  zodat er niet twee animaties door elkaar lopen.
  Patroon overgenomen uit github.com/mieras/astro-gsap-page-transitions.
*/

export type TransitionContext = {
  type: "initial" | "forward" | "back";
  from: URL;
  to: URL;
  container: HTMLElement | null; // [data-page] van de huidige (leave) of nieuwe (enter) pagina
};
type Hook = (ctx: TransitionContext) => void | Promise<unknown>; // GSAP-tweens/timelines zijn thenable

const leaveHooks = new Set<Hook>();
const enterHooks = new Set<Hook>();

/** Registreer een leave-animatie. Geeft een functie terug om hem weer af te melden. */
export const onLeave = (fn: Hook) => (leaveHooks.add(fn), () => leaveHooks.delete(fn));
/** Registreer een enter-animatie (ook bij de eerste load: ctx.type === "initial"). */
export const onEnter = (fn: Hook) => (enterHooks.add(fn), () => enterHooks.delete(fn));

const BAR_DELAY_MS = 150; // snelle navigaties tonen geen balk
const root = document.documentElement;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const container = () => document.querySelector<HTMLElement>("[data-page]");
const run = (hooks: Set<Hook>, ctx: TransitionContext) =>
  Promise.all([...hooks].map((fn) => fn(ctx)));

let current: TransitionContext | null = null;
let barTimer: ReturnType<typeof setTimeout> | undefined;

document.addEventListener("astro:before-preparation", (event) => {
  current = {
    type: event.direction === "back" ? "back" : "forward",
    from: event.from,
    to: event.to,
    container: container(),
  };
  root.toggleAttribute("data-navigating", true);
  barTimer = setTimeout(() => root.setAttribute("data-progress", "loading"), BAR_DELAY_MS);

  if (reducedMotion() || leaveHooks.size === 0) return;
  const ctx = current;
  const load = event.loader;
  event.loader = async () => {
    await Promise.all([load(), run(leaveHooks, ctx)]);
  };
});

document.addEventListener("astro:before-swap", (event) => {
  if (leaveHooks.size || enterHooks.size) event.viewTransition.skipTransition();
});

document.addEventListener("astro:page-load", async () => {
  clearTimeout(barTimer);
  if (root.getAttribute("data-progress") === "loading") {
    root.setAttribute("data-progress", "done");
    setTimeout(() => root.removeAttribute("data-progress"), 400);
  }

  const ctx: TransitionContext = current
    ? { ...current, container: container() }
    : { type: "initial", from: new URL(location.href), to: new URL(location.href), container: container() };
  current = null;

  if (!reducedMotion()) await run(enterHooks, ctx);
  root.removeAttribute("data-navigating");
  // Voor reveals e.d. die pas na de enter-animatie mogen starten.
  document.dispatchEvent(new CustomEvent("page:transition-end", { detail: ctx }));
});
