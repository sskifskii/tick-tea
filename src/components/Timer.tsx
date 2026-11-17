import { useLanguage } from "../hooks/useLanguage";
import { Check, Pause } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Session } from "../lib/session";
import { formatTime } from "../lib/session";
import { useTimer } from "../hooks/useTimer";
import { TimerRing } from "./TimerRing";

export function Timer({ session }: { session: Session }) {
  const { t } = useLanguage();
  const remaining = useTimer(session);
  const completed = session.status === "completed";
  return (
    <div
      className={`timer timer--${session.status}`}
      role="timer"
      aria-label={t("Пролив {infusion}, осталось {time}", {
        infusion: session.infusion,
        time: formatTime(remaining),
      })}
    >
      <TimerRing session={session} />
      <div className="timer-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={session.infusion}
            className="infusion-label"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {t("ПРОЛИВ")} {String(session.infusion).padStart(2, "0")}
          </motion.div>
        </AnimatePresence>
        <div className="timer-digits" aria-hidden="true">
          {formatTime(remaining)}
        </div>
        <div className="timer-caption">
          {completed ? (
            <>
              <Check size={15} /> {t("Можно разливать")}
            </>
          ) : session.status === "paused" ? (
            <>
              <Pause size={13} /> {t("Момент тишины")}
            </>
          ) : session.status === "running" ? (
            <>
              <span className="breathing-dot" /> {t("Чай раскрывается")}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
