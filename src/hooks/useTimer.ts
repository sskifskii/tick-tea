import { useEffect, useState } from "react";
import type { Session } from "../lib/session";
import { remainingAt } from "../lib/session";

// Only the clock component updates during the countdown; the rest of the UI remains stable.
export function useTimer(session: Session) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (session.status !== "running") return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, [session.status, session.endsAt]);
  // Avoid showing the time from the pause until the first tick after resuming.
  const displayNow =
    session.status === "running"
      ? Math.max(now, (session.endsAt ?? now) - session.remainingMs)
      : now;
  return remainingAt(session, displayNow);
}
