// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createSession, transition } from "../lib/session";
import { TimerRing } from "./TimerRing";

let reducedMotion = false;
let hidden = false;
let nextFrameId = 0;
const frames = new Map<number, FrameRequestCallback>();
const cancelFrame = vi.fn((id: number) => frames.delete(id));

function frameAt(now: number) {
  act(() => {
    vi.setSystemTime(now);
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  });
}

function expectProgress(container: HTMLElement, progress: number) {
  const transform =
    container.querySelector<HTMLElement>(".ring-dot-orbit")?.style.transform ??
    "";
  expect(Number.parseFloat(transform.slice("rotate(".length))).toBeCloseTo(
    progress * 360,
  );
  expect(
    Number(
      container
        .querySelector(".progress-ring")
        ?.getAttribute("stroke-dashoffset"),
    ),
  ).toBeCloseTo(2 * Math.PI * 144 * (1 - progress));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  reducedMotion = false;
  hidden = false;
  frames.clear();
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return reducedMotion;
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = ++nextFrameId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelFrame);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.useRealTimers();
});

it("updates both arc and marker without the Web Animations API", () => {
  const running = transition(createSession(30), { type: "start", now: 100000 });
  const { container, rerender, unmount } = render(
    <TimerRing session={running} />,
  );
  expect(Element.prototype.animate).toBeUndefined();
  expectProgress(container, 0);
  frameAt(107500);
  expectProgress(container, 0.25);
  expect(frames.size).toBe(1);
  rerender(<TimerRing session={running} />);
  expect(frames.size).toBe(1);
  frameAt(130000);
  expectProgress(container, 1);
  expect(frames.size).toBe(0);
  unmount();
});

it("freezes on pause, resumes from the saved time, and cancels on unmount", () => {
  const running = transition(createSession(30), { type: "start", now: 100000 });
  const { container, rerender, unmount } = render(
    <TimerRing session={running} />,
  );
  frameAt(115000);
  const paused = transition(running, { type: "pause", now: Date.now() });
  rerender(<TimerRing session={paused} />);
  expectProgress(container, 0.5);
  expect(frames.size).toBe(0);
  vi.setSystemTime(200000);
  rerender(
    <TimerRing
      session={transition(paused, { type: "start", now: Date.now() })}
    />,
  );
  expectProgress(container, 0.5);
  frameAt(207500);
  expectProgress(container, 0.75);
  unmount();
  expect(frames.size).toBe(0);
});

it("stops background updates and resynchronizes after background suspension", () => {
  const running = transition(createSession(30), { type: "start", now: 100000 });
  const { container } = render(<TimerRing session={running} />);
  hidden = true;
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(frames.size).toBe(0);
  vi.setSystemTime(120000);
  hidden = false;
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expectProgress(container, 2 / 3);
  expect(frames.size).toBe(1);
  vi.setSystemTime(140000);
  act(() => window.dispatchEvent(new Event("pageshow")));
  expectProgress(container, 1);
  expect(frames.size).toBe(0);
});

it("keeps progress visible in discrete steps with reduced motion", () => {
  reducedMotion = true;
  const running = transition(createSession(4), { type: "start", now: 100000 });
  const { container, unmount } = render(<TimerRing session={running} />);
  expect(frames.size).toBe(0);
  act(() => vi.advanceTimersByTime(1000));
  expectProgress(container, 0.25);
  act(() => vi.advanceTimersByTime(3000));
  expectProgress(container, 1);
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});
