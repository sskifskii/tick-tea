import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, transition } from "../lib/session";
import type { SessionAction } from "../lib/session";
import { loadState, saveState } from "../lib/storage";
import type { SavedState, Settings } from "../lib/storage";
import { completionFeedback } from "../lib/feedback";

export function useTeaSession() {
  const [state, setState] = useState<SavedState>(loadState);
  const ref = useRef(state);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const commit = useCallback((next: SavedState) => {
    ref.current = next;
    setState(next);
    setStorageAvailable(saveState(next));
  }, []);
  const dispatch = useCallback(
    (action: SessionAction) => {
      const current = ref.current;
      const next = transition(current.session, action);
      if (next === current.session) return;
      if (current.session.status === "running" && next.status === "completed")
        completionFeedback(current.settings);
      commit({ ...current, session: next });
    },
    [commit],
  );
  useEffect(() => {
    if (state.session?.status !== "running") return;
    const tick = () => dispatch({ type: "tick", now: Date.now() });
    const interval = window.setInterval(tick, 200);
    window.addEventListener("pageshow", tick);
    document.addEventListener("visibilitychange", tick);
    tick();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pageshow", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.session?.status, dispatch]);
  const endSession = () => commit({ ...ref.current, session: createSession() });
  const setSettings = (settings: Settings) =>
    commit({ ...ref.current, settings });
  return {
    ...state,
    dispatch,
    endSession,
    setSettings,
    storageAvailable,
  };
}
