import { useLayoutEffect, useRef } from "react";
import { remainingAt, type Session } from "../lib/session";

const circumference = 2 * Math.PI * 144;

export function TimerRing({ session }: { session: Session }) {
  const ringRef = useRef<SVGCircleElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const { status, duration } = session;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;
    let frame: number | undefined;
    let timeout: number | undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancelUpdate = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      if (timeout !== undefined) window.clearTimeout(timeout);
      frame = undefined;
      timeout = undefined;
    };
    const update = () => {
      frame = undefined;
      timeout = undefined;
      const remaining = remainingAt(session, Date.now());
      const progress =
        status === "idle" ? 0 : 1 - remaining / (duration * 1000);
      const offset = status === "idle" ? 0 : circumference * (1 - progress);
      // Update the SVG attribute directly: no Web Animations API or CSS
      // interpolation is needed to keep the arc and marker in sync.
      ring.setAttribute("stroke-dashoffset", String(offset));
      dot.style.transform = `rotate(${progress * 360}deg)`;
      if (status !== "running" || remaining <= 0 || document.hidden) return;
      if (reducedMotion.matches) {
        // Reduced motion still shows progress, in discrete one-second steps.
        timeout = window.setTimeout(update, Math.min(1000, remaining));
      } else {
        frame = window.requestAnimationFrame(update);
      }
    };
    const sync = () => {
      cancelUpdate();
      update();
    };
    sync();
    // Reconcile with the wall clock after iOS suspends a background page.
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      cancelUpdate();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [session]);

  return (
    <>
      <svg
        className="timer-ring"
        viewBox="0 0 320 320"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="160"
          cy="160"
          r="154"
          stroke="currentColor"
          strokeOpacity=".07"
          strokeDasharray="1 10"
        />
        <circle
          cx="160"
          cy="160"
          r="144"
          stroke="currentColor"
          strokeOpacity=".11"
          strokeWidth="2"
        />
        <circle
          ref={ringRef}
          className="progress-ring"
          cx="160"
          cy="160"
          r="144"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform="rotate(-90 160 160)"
        />
      </svg>
      <div ref={dotRef} className="ring-dot-orbit" aria-hidden="true">
        <span className="ring-dot" />
      </div>
    </>
  );
}
