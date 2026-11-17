import { Check, Pause } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Session } from "../lib/session";
import { formatTime } from "../lib/session";
import { useTimer } from "../hooks/useTimer";

export function Timer({ session }: { session: Session }) {
  const remaining = useTimer(session);
  const progress = 1 - remaining / (session.duration * 1000);
  const completed = session.status === "completed";
  const circumference = 2 * Math.PI * 144;
  return (
    <div
      className={`timer timer--${session.status}`}
      role="timer"
      aria-label={`Пролив ${session.infusion}, осталось ${formatTime(remaining)}`}
    >
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
          className="progress-ring"
          cx="160"
          cy="160"
          r="144"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - (session.status === "idle" ? 1 : progress))
          }
          transform="rotate(-90 160 160)"
        />
        <circle
          cx="160"
          cy="16"
          r="4"
          fill="currentColor"
          className="ring-dot"
          style={{
            transform: `rotate(${session.status === "idle" ? 0 : progress * 360}deg)`,
          }}
        />
      </svg>
      <div className="timer-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={session.infusion}
            className="infusion-label"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            ПРОЛИВ {String(session.infusion).padStart(2, "0")}
          </motion.div>
        </AnimatePresence>
        <div className="timer-digits" aria-hidden="true">
          {formatTime(remaining)}
        </div>
        <div className="timer-caption">
          {completed ? (
            <>
              <Check size={15} /> Можно разливать
            </>
          ) : session.status === "paused" ? (
            <>
              <Pause size={13} /> Момент тишины
            </>
          ) : session.status === "running" ? (
            <>
              <span className="breathing-dot" /> Чай раскрывается
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
