import { useEffect, useState } from "react";
import type { Session } from "../lib/session";
import { remainingAt } from "../lib/session";

// Только компонент часов обновляется во время отсчёта; каталог и остальной UI стабильны.
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
  // До первого тика после продолжения не показываем время из момента паузы.
  const displayNow =
    session.status === "running"
      ? Math.max(now, (session.endsAt ?? now) - session.remainingMs)
      : now;
  return remainingAt(session, displayNow);
}
