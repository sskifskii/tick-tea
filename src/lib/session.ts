export const MIN_SECONDS = 1;
export const MAX_SECONDS = 3599;
export type TimerStatus = "idle" | "running" | "paused" | "completed";
export interface Infusion {
  number: number;
  duration: number;
}
export interface Session {
  increment: number;
  infusion: number;
  duration: number;
  remainingMs: number;
  endsAt: number | null;
  status: TimerStatus;
  history: Infusion[];
}
export type SessionAction =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "tick"; now: number }
  | { type: "set-duration"; seconds: number }
  | { type: "restart" }
  | { type: "set-increment"; seconds: number }
  | { type: "next" };
export const clampDuration = (seconds: number) =>
  Math.min(
    MAX_SECONDS,
    Math.max(
      MIN_SECONDS,
      Math.round(Number.isFinite(seconds) ? seconds : MIN_SECONDS),
    ),
  );
export const nextDuration = (actual: number, increment: number) =>
  clampDuration(actual + increment);
export const remainingAt = (session: Session, now: number) =>
  session.status === "running" && session.endsAt !== null
    ? Math.min(session.duration * 1000, Math.max(0, session.endsAt - now))
    : session.remainingMs;
export const clampIncrement = (seconds: number) =>
  Math.min(
    MAX_SECONDS,
    Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0)),
  );
export const createSession = (initialTime = 30, increment = 5): Session => ({
  increment: clampIncrement(increment),
  infusion: 1,
  duration: clampDuration(initialTime),
  remainingMs: clampDuration(initialTime) * 1000,
  endsAt: null,
  status: "idle",
  history: [],
});
export function reconcile(session: Session, now: number): Session {
  if (session.status !== "running" || remainingAt(session, now) > 0)
    return session;
  return {
    ...session,
    status: "completed",
    remainingMs: 0,
    endsAt: null,
    history: [
      ...session.history.filter((item) => item.number !== session.infusion),
      { number: session.infusion, duration: session.duration },
    ],
  };
}
export function transition(session: Session, action: SessionAction): Session {
  switch (action.type) {
    case "start":
      if (session.status !== "idle" && session.status !== "paused")
        return session;
      return {
        ...session,
        status: "running",
        endsAt: action.now + session.remainingMs,
      };
    case "tick":
      return reconcile(session, action.now);
    case "pause": {
      if (session.status !== "running") return session;
      const current = reconcile(session, action.now);
      if (current.status === "completed") return current;
      return {
        ...current,
        status: "paused",
        remainingMs: remainingAt(session, action.now),
        endsAt: null,
      };
    }
    case "set-duration": {
      if (session.status !== "idle" && session.status !== "paused")
        return session;
      const duration = clampDuration(action.seconds);
      return {
        ...session,
        duration,
        remainingMs: duration * 1000,
        status: "idle",
        endsAt: null,
      };
    }
    case "set-increment":
      return { ...session, increment: clampIncrement(action.seconds) };
    case "restart":
      return {
        ...session,
        status: "idle",
        remainingMs: session.duration * 1000,
        endsAt: null,
        history: session.history.filter(
          (item) => item.number !== session.infusion,
        ),
      };
    case "next": {
      if (session.status !== "completed") return session;
      const duration = nextDuration(session.duration, session.increment);
      return {
        ...session,
        infusion: session.infusion + 1,
        duration,
        remainingMs: duration * 1000,
        endsAt: null,
        status: "idle",
      };
    }
  }
}
export const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
};
