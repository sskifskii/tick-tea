import { useCallback, useEffect, useRef, useState } from "react";
import type { Tea } from "../data/teas";
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
      if (!current.session) return;
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
  const selectTea = (tea: Tea) =>
    commit({ ...ref.current, session: createSession(tea) });
  const endSession = () => commit({ ...ref.current, session: null });
  const setSettings = (settings: Settings) =>
    commit({ ...ref.current, settings });
  return {
    ...state,
    dispatch,
    selectTea,
    endSession,
    setSettings,
    storageAvailable,
  };
}
