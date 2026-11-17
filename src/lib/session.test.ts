import { describe, expect, it } from "vitest";
import {
  clampDuration,
  createSession,
  formatTime,
  MAX_SECONDS,
  nextDuration,
  reconcile,
  remainingAt,
  transition,
} from "./session";
const first = () => createSession(40, 15);
const finished = (duration = 40) => {
  let s = transition(first(), { type: "set-duration", seconds: duration });
  s = transition(s, { type: "start", now: 1000 });
  return transition(s, { type: "tick", now: 1000 + duration * 1000 });
};
describe("duration", () => {
  it("uses the configured 40 seconds for the first infusion", () => {
    expect(first()).toMatchObject({
      infusion: 1,
      duration: 40,
      remainingMs: 40000,
      status: "idle",
      history: [],
    });
  });
  it("calculates 40 → 55 → 70", () => {
    expect(nextDuration(40, 15)).toBe(55);
    expect(nextDuration(55, 15)).toBe(70);
  });
  it("uses a manually reduced duration: 40 → 30 → 45", () => {
    let s = transition(finished(), { type: "next" });
    expect(s.duration).toBe(55);
    s = transition(s, { type: "set-duration", seconds: 30 });
    s = transition(s, { type: "start", now: 50000 });
    s = transition(s, { type: "tick", now: 80000 });
    expect(s.history).toEqual([
      { number: 1, duration: 40 },
      { number: 2, duration: 30 },
    ]);
    s = transition(s, { type: "next" });
    expect(s).toMatchObject({ duration: 45, infusion: 3, status: "idle" });
  });
  it("uses a manually increased duration", () => {
    expect(transition(finished(60), { type: "next" }).duration).toBe(75);
  });
  it("clamps zero, negative, fractional, infinite and large values", () => {
    expect([-5, 0, NaN, Infinity].map(clampDuration)).toEqual([1, 1, 1, 1]);
    expect(clampDuration(5.7)).toBe(6);
    expect(clampDuration(9999)).toBe(MAX_SECONDS);
    expect(nextDuration(MAX_SECONDS, 15)).toBe(MAX_SECONDS);
  });
  it("keeps the duration for a zero increment and applies increment changes to the next infusion", () => {
    let s = transition(finished(), { type: "set-increment", seconds: 0 });
    expect(transition(s, { type: "next" }).duration).toBe(40);
    s = transition(s, { type: "set-increment", seconds: 12 });
    expect(transition(s, { type: "next" })).toMatchObject({
      duration: 52,
      increment: 12,
    });
    expect(s.history).toEqual([{ number: 1, duration: 40 }]);
  });
  it("resets the current countdown and preserves previous history when edited while paused", () => {
    let s = transition(finished(), { type: "next" });
    s = transition(s, { type: "start", now: 50000 });
    s = transition(s, { type: "pause", now: 60000 });
    s = transition(s, { type: "set-duration", seconds: 20 });
    expect(s).toMatchObject({
      status: "idle",
      duration: 20,
      remainingMs: 20000,
      infusion: 2,
      history: [{ number: 1, duration: 40 }],
    });
    s = transition(s, { type: "start", now: 70000 });
    s = transition(s, { type: "tick", now: 90000 });
    expect(transition(s, { type: "next" }).duration).toBe(35);
  });
  it("prevents editing a running timer", () => {
    const s = transition(first(), { type: "start", now: 0 });
    expect(transition(s, { type: "set-duration", seconds: 5 })).toBe(s);
  });
});
describe("timer transitions", () => {
  it("sets an exact end timestamp", () => {
    expect(transition(first(), { type: "start", now: 1500 }).endsAt).toBe(
      41500,
    );
  });
  it("preserves milliseconds when paused and sets a new deadline when resumed", () => {
    let s = transition(first(), { type: "start", now: 1000 });
    s = transition(s, { type: "pause", now: 13250 });
    expect(s).toMatchObject({
      status: "paused",
      remainingMs: 27750,
      endsAt: null,
    });
    expect(remainingAt(s, 999999)).toBe(27750);
    s = transition(s, { type: "start", now: 50000 });
    expect(s.endsAt).toBe(77750);
    expect(remainingAt(s, 50250)).toBe(27500);
  });
  it("completes when paused after the deadline", () => {
    const s = transition(first(), { type: "start", now: 0 });
    expect(transition(s, { type: "pause", now: 50000 }).status).toBe(
      "completed",
    );
  });
  it("catches up after prolonged inactivity without negative values", () => {
    const s = transition(first(), { type: "start", now: 1000 });
    expect(remainingAt(s, 999999)).toBe(0);
    expect(reconcile(s, 999999)).toMatchObject({
      status: "completed",
      infusion: 1,
      remainingMs: 0,
      endsAt: null,
      history: [{ number: 1, duration: 40 }],
    });
  });
  it("does not complete before the deadline", () => {
    const s = transition(first(), { type: "start", now: 1000 });
    expect(reconcile(s, 40999)).toBe(s);
  });
  it("does not exceed the configured duration when the clock moves backward", () => {
    const s = transition(first(), { type: "start", now: 50000 });
    expect(remainingAt(s, 1000)).toBe(40000);
  });
  it("keeps the infusion number on completion and does not start the next infusion automatically", () => {
    const s = finished();
    expect(s.infusion).toBe(1);
    expect(transition(s, { type: "next" })).toMatchObject({
      infusion: 2,
      status: "idle",
      remainingMs: 55000,
      endsAt: null,
    });
  });
  it("does not start or advance twice on rapid repeated clicks", () => {
    const running = transition(first(), { type: "start", now: 0 });
    expect(transition(running, { type: "start", now: 1000 })).toBe(running);
    const next = transition(finished(), { type: "next" });
    expect(transition(next, { type: "next" })).toBe(next);
    const complete = finished();
    expect(transition(complete, { type: "tick", now: 999999 })).toBe(complete);
  });
  it("resets the countdown on restart while preserving the infusion number and duration", () => {
    let s = transition(first(), { type: "start", now: 0 });
    s = transition(s, { type: "pause", now: 10000 });
    s = transition(s, { type: "restart" });
    expect(s).toMatchObject({
      status: "idle",
      remainingMs: 40000,
      infusion: 1,
      duration: 40,
      history: [],
    });
    expect(transition(s, { type: "set-duration", seconds: 20 }).duration).toBe(
      20,
    );
  });
  it("does not duplicate history when restarting a completed infusion", () => {
    let s = transition(finished(), { type: "restart" });
    expect(s.history).toEqual([]);
    s = transition(s, { type: "start", now: 50000 });
    s = transition(s, { type: "tick", now: 90000 });
    expect(s.history).toEqual([{ number: 1, duration: 40 }]);
  });
  it("leaves the state unchanged for invalid transitions", () => {
    const s = first();
    expect(transition(s, { type: "next" })).toBe(s);
    expect(transition(s, { type: "pause", now: 1000 })).toBe(s);
  });
  it("does not carry previous history into a new session", () => {
    const s = createSession(15, 10);
    expect(s).toMatchObject({
      increment: 10,
      infusion: 1,
      duration: 15,
      status: "idle",
      history: [],
    });
  });
  it("formats seconds by rounding up", () => {
    expect(formatTime(39901)).toBe("00:40");
    expect(formatTime(70000)).toBe("01:10");
    expect(formatTime(-2)).toBe("00:00");
    expect(formatTime(3599000)).toBe("59:59");
  });
});
