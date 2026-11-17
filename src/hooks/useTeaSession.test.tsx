// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "../lib/storage";
import { useTeaSession } from "./useTeaSession";

vi.mock("../lib/feedback", () => ({ completionFeedback: vi.fn() }));
import { completionFeedback } from "../lib/feedback";
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  vi.mocked(completionFeedback).mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("live session management", () => {
  it("runs scenario A and sends one completion signal", () => {
    const { result } = renderHook(useTeaSession);
    act(() => {
      result.current.dispatch({ type: "set-duration", seconds: 40 });
      result.current.dispatch({ type: "set-increment", seconds: 15 });
    });
    act(() => result.current.dispatch({ type: "start", now: Date.now() }));
    act(() => vi.advanceTimersByTime(40000));
    expect(result.current.session).toMatchObject({
      status: "completed",
      infusion: 1,
    });
    expect(completionFeedback).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(3000));
    expect(completionFeedback).toHaveBeenCalledTimes(1);
    act(() => result.current.dispatch({ type: "next" }));
    expect(result.current.session).toMatchObject({
      duration: 55,
      status: "idle",
      infusion: 2,
    });
  });
  it("scenario B: a manual 30-second duration makes the next infusion 45 seconds", () => {
    const { result } = renderHook(useTeaSession);
    act(() => {
      result.current.dispatch({ type: "set-duration", seconds: 40 });
      result.current.dispatch({ type: "set-increment", seconds: 15 });
    });
    act(() => result.current.dispatch({ type: "start", now: Date.now() }));
    act(() => vi.advanceTimersByTime(40000));
    act(() => result.current.dispatch({ type: "next" }));
    act(() => result.current.dispatch({ type: "set-duration", seconds: 30 }));
    act(() => result.current.dispatch({ type: "start", now: Date.now() }));
    act(() => vi.advanceTimersByTime(30000));
    act(() => result.current.dispatch({ type: "next" }));
    expect(result.current.session).toMatchObject({
      duration: 45,
      infusion: 3,
      history: [
        { number: 1, duration: 40 },
        { number: 2, duration: 30 },
      ],
    });
  });
  it("scenario C: unmounts and reopens an expired 70-second session", () => {
    const first = renderHook(useTeaSession);
    act(() =>
      first.result.current.dispatch({ type: "set-duration", seconds: 70 }),
    );
    act(() =>
      first.result.current.dispatch({ type: "start", now: Date.now() }),
    );
    first.unmount();
    act(() => vi.advanceTimersByTime(75000));
    const restored = renderHook(useTeaSession);
    expect(restored.result.current.session).toMatchObject({
      duration: 70,
      infusion: 1,
      status: "completed",
    });
    expect(restored.result.current.session?.history).toHaveLength(1);
    expect(completionFeedback).not.toHaveBeenCalled();
  });
  it("reads the latest state for rapid actions before React rerenders", () => {
    const { result } = renderHook(useTeaSession);
    act(() => {
      result.current.dispatch({ type: "set-duration", seconds: 40 });
      result.current.dispatch({ type: "start", now: Date.now() });
      result.current.dispatch({ type: "start", now: Date.now() + 5000 });
    });
    expect(result.current.session?.endsAt).toBe(140000);
    act(() => vi.advanceTimersByTime(40000));
    act(() => {
      result.current.dispatch({ type: "next" });
      result.current.dispatch({ type: "next" });
    });
    expect(result.current.session?.infusion).toBe(2);
  });
  it("ending a session resets the timer and history for a new tea session", () => {
    const { result } = renderHook(useTeaSession);
    act(() => {
      result.current.dispatch({ type: "set-duration", seconds: 40 });
      result.current.dispatch({ type: "set-increment", seconds: 15 });
    });
    act(() => result.current.dispatch({ type: "start", now: Date.now() }));
    act(() => result.current.endSession());
    expect(
      JSON.parse(sessionStorage.getItem(STORAGE_KEY)!).session.history,
    ).toEqual([]);
    act(() => vi.advanceTimersByTime(40000));
    expect(result.current.session).toMatchObject({
      status: "idle",
      duration: 30,
      infusion: 1,
      history: [],
    });
  });
  it("catches up on visibilitychange without waiting for the next tick", () => {
    const { result } = renderHook(useTeaSession);
    act(() => {
      result.current.dispatch({ type: "set-duration", seconds: 40 });
      result.current.dispatch({ type: "set-increment", seconds: 15 });
    });
    act(() => result.current.dispatch({ type: "start", now: Date.now() }));
    act(() => {
      vi.setSystemTime(200000);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.session?.status).toBe("completed");
    expect(completionFeedback).toHaveBeenCalledTimes(1);
  });
});
