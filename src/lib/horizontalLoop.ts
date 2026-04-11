import gsap from "gsap";

export interface HorizontalLoopConfig {
  repeat?: number;
  paused?: boolean;
  speed?: number;
  snap?: number | false | ((v: number) => number);
  paddingRight?: number;
  reversed?: boolean;
}

function getNum(el: Element, prop: string): number {
  const v = gsap.getProperty(el, prop as "x");
  if (typeof v === "number") return v;
  return parseFloat(String(v)) || 0;
}

/**
 * GSAP horizontalLoop – seamless infinite horizontal scroll.
 * Use timeScale to control direction (+1 forward, -1 reverse, 0 paused).
 * totalWidth is exposed so callers can set up external Draggable integration.
 */
export function horizontalLoop(
  items: gsap.TweenTarget,
  config: HorizontalLoopConfig = {}
): gsap.core.Timeline & {
  next: (vars?: gsap.TweenVars) => gsap.core.Tween;
  previous: (vars?: gsap.TweenVars) => gsap.core.Tween;
  current: () => number;
  toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween;
  times: number[];
  totalWidth: number;
} {
  const list = gsap.utils.toArray(items) as Element[];
  const tl = gsap.timeline({
    repeat: config.repeat,
    paused: config.paused,
    defaults: { ease: "none" as const },
    onReverseComplete: () => {
      const t = (tl as unknown as { rawTime?: () => number }).rawTime?.() ?? tl.time();
      tl.totalTime(t + tl.duration() * 100);
    },
  });
  const length = list.length;
  const startX = (list[0] as HTMLElement).offsetLeft;
  const times: number[] = [];
  const widths: number[] = [];
  const xPercents: number[] = [];
  let curIndex = 0;
  const pixelsPerSecond = (config.speed ?? 1) * 100;
  const snap: (v: number) => number =
    config.snap === false
      ? (v: number) => v
      : typeof config.snap === "function"
      ? config.snap
      : gsap.utils.snap(config.snap ?? 1);

  gsap.set(list, {
    xPercent: (i: number, el: Element) => {
      const w = (widths[i] = getNum(el, "width") || (el as HTMLElement).offsetWidth);
      const x = getNum(el, "x");
      const xPct = getNum(el, "xPercent");
      xPercents[i] = snap((x / w) * 100 + xPct);
      return xPercents[i];
    },
  });
  gsap.set(list, { x: 0 });

  const last = list[length - 1] as HTMLElement;
  const scaleX = getNum(last, "scaleX") || 1;
  const totalWidth =
    last.offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    last.offsetWidth * scaleX +
    (config.paddingRight ?? 0);

  for (let i = 0; i < length; i++) {
    const item = list[i] as HTMLElement;
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const itemScaleX = getNum(item, "scaleX") || 1;
    const distanceToLoop = distanceToStart + widths[i] * itemScaleX;

    tl.to(
      item,
      {
        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    )
      .fromTo(
        item,
        {
          xPercent: snap(
            ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
          ),
        },
        {
          xPercent: xPercents[i],
          duration:
            (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
      .add(`label${i}`, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }

  const toIndex = (index: number, vars?: gsap.TweenVars): gsap.core.Tween => {
    vars = vars || {};
    if (Math.abs(index - curIndex) > length / 2) {
      index += index > curIndex ? -length : length;
    }
    const newIndex = gsap.utils.wrap(0, length, index);
    let time = times[newIndex];
    if ((time > tl.time()) !== (index > curIndex)) {
      (vars as gsap.TweenVars & { modifiers?: { time: (t: number) => number } }).modifiers = {
        time: gsap.utils.wrap(0, tl.duration()),
      };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    (vars as gsap.TweenVars & { overwrite?: boolean }).overwrite = true;
    return tl.tweenTo(time, vars);
  };

  type ExtTl = gsap.core.Timeline & {
    next: (vars?: gsap.TweenVars) => gsap.core.Tween;
    previous: (vars?: gsap.TweenVars) => gsap.core.Tween;
    current: () => number;
    toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween;
    times: number[];
    totalWidth: number;
  };

  const extTl = tl as ExtTl;

  extTl.next = (vars?: gsap.TweenVars) => toIndex(curIndex + 1, vars);
  extTl.previous = (vars?: gsap.TweenVars) => toIndex(curIndex - 1, vars);
  extTl.current = () => curIndex;
  extTl.toIndex = (index: number, vars?: gsap.TweenVars) => toIndex(index, vars);
  extTl.times = times;
  extTl.totalWidth = totalWidth;

  tl.progress(1, true).progress(0, true);

  if (config.reversed) {
    tl.vars.onReverseComplete?.();
    tl.reverse();
  }

  return extTl;
}
