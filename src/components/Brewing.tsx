import { useLanguage } from "../hooks/useLanguage";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Session, SessionAction } from "../lib/session";
import { MAX_SECONDS, MIN_SECONDS, nextDuration } from "../lib/session";
import { Timer } from "./Timer";
import { Modal } from "./Modal";
import { unlockAudio } from "../lib/feedback";

export function Brewing({
  session,
  dispatch,
  onEnd,
}: {
  session: Session;
  dispatch: (action: SessionAction) => void;
  onEnd: () => void;
}) {
  const { t } = useLanguage();
  const heading = useRef<HTMLHeadingElement>(null);
  const durationInput = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const [dialog, setDialog] = useState<
    "time" | "increment" | "restart" | "end" | null
  >(null);
  const [precise, setPrecise] = useState(String(session.duration));
  const canEdit = session.status === "idle" || session.status === "paused";
  const completed = session.status === "completed";
  const labels = {
    idle: t("Начать пролив"),
    running: t("Пауза"),
    paused: t("Продолжить"),
    completed: t("Следующий пролив"),
  };
  const primary = () => {
    unlockAudio();
    if (completed) dispatch({ type: "next" });
    else if (session.status === "running")
      dispatch({ type: "pause", now: Date.now() });
    else dispatch({ type: "start", now: Date.now() });
  };
  const restart = () => {
    dispatch({ type: "restart" });
    setDialog(null);
  };
  const exactValid =
    /^\d+$/.test(precise) &&
    Number(precise) >= (dialog === "increment" ? 0 : MIN_SECONDS) &&
    Number(precise) <= MAX_SECONDS;
  return (
    <motion.main
      className="brewing page-width"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <h1 ref={heading} tabIndex={-1} className="sr-only">
        {t("Таймер заваривания")}
      </h1>
      <div className="brew-layout">
        <section className="brew-main" aria-label={t("Таймер заваривания")}>
          <div className="timer-stage">
            <Timer session={session} />
            <div
              className={`quick-adjust ${canEdit ? "" : "quick-adjust--locked"}`}
            >
              <button
                aria-label={t("Уменьшить время на 5 секунд")}
                disabled={!canEdit || session.duration === MIN_SECONDS}
                onClick={() =>
                  dispatch({
                    type: "set-duration",
                    seconds: session.duration - 5,
                  })
                }
              >
                <Minus size={15} />5 {t("с")}
              </button>
              <button
                className="time-edit"
                disabled={!canEdit}
                onClick={() => {
                  setPrecise(String(session.duration));
                  setDialog("time");
                }}
              >
                <SlidersHorizontal size={15} /> {t("Изменить время")}
              </button>
              <button
                aria-label={t("Увеличить время на 5 секунд")}
                disabled={!canEdit || session.duration === MAX_SECONDS}
                onClick={() =>
                  dispatch({
                    type: "set-duration",
                    seconds: session.duration + 5,
                  })
                }
              >
                <Plus size={15} />5 {t("с")}
              </button>
            </div>
          </div>
          <div className="brew-panel">
            <div className="timer-parameters">
              <button
                disabled={!canEdit}
                onClick={() => {
                  setPrecise(String(session.duration));
                  setDialog("time");
                }}
              >
                <span>
                  {session.infusion === 1
                    ? t("Стартовое время")
                    : t("Текущий пролив")}
                </span>
                <strong>
                  {session.duration}
                  <small> {t("с")}</small>
                </strong>
              </button>
              <button
                onClick={() => {
                  setPrecise(String(session.increment));
                  setDialog("increment");
                }}
              >
                <span>{t("Прибавлять к проливу")}</span>
                <strong>
                  +{session.increment}
                  <small> {t("с")}</small>
                </strong>
              </button>
            </div>
            <div className="timer-controls">
              <motion.button
                className="primary-button"
                whileTap={{ scale: 0.98 }}
                onClick={primary}
              >
                {session.status === "running" ? (
                  <Pause size={19} fill="currentColor" />
                ) : completed ? (
                  <ArrowRight size={21} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                {labels[session.status]}
              </motion.button>
              <div className="under-button" aria-live="polite">
                {completed
                  ? t(
                      "Следующий — {seconds} с. Начните, когда будете готовы.",
                      {
                        seconds: nextDuration(
                          session.duration,
                          session.increment,
                        ),
                      },
                    )
                  : session.status === "running"
                    ? t("Вдохните. Всё идёт своим чередом.")
                    : session.status === "paused"
                      ? t("Продолжите или начните этот пролив заново.")
                      : t("Залейте воду и нажмите, чтобы начать.")}
              </div>
              <div className="secondary-controls">
                <button
                  disabled={session.status === "idle"}
                  onClick={() =>
                    session.status === "completed"
                      ? restart()
                      : setDialog("restart")
                  }
                >
                  <RotateCcw size={15} /> {t("Заново")}
                </button>
                <span />
                <button onClick={() => setDialog("end")}>
                  <X size={15} /> {t("Завершить чаепитие")}
                </button>
              </div>
            </div>

            <section className="history" aria-labelledby="history-title">
              <div className="history-heading">
                <h2 id="history-title">{t("История проливов")}</h2>
                <span>{String(session.history.length).padStart(2, "0")}</span>
              </div>
              {session.history.length === 0 ? (
                <p className="history-empty">
                  {t("Первый глоток ещё впереди.")}
                  <br />
                  {t("Здесь появится история вашего чаепития.")}
                </p>
              ) : (
                <motion.ol layoutScroll>
                  {[...session.history].reverse().map((item) => (
                    <motion.li
                      key={item.number}
                      layout={reducedMotion ? false : "position"}
                      initial={reducedMotion ? false : { y: -6 }}
                      animate={{ y: 0 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <span>
                        <Check size={14} /> {t("Пролив")}{" "}
                        {String(item.number).padStart(2, "0")}
                      </span>
                      <strong>
                        {item.duration} <small>{t("с")}</small>
                      </strong>
                    </motion.li>
                  ))}
                </motion.ol>
              )}
              <div className="history-foot">
                <span className="status-dot" />{" "}
                {t("Сохраняется в этой вкладке до её закрытия")}
              </div>
            </section>
          </div>
        </section>
      </div>
      {(dialog === "time" || dialog === "increment") && (
        <Modal
          initialFocusRef={durationInput}
          title={
            dialog === "increment"
              ? t("Шаг между проливами")
              : t("Время вашего пролива")
          }
          onClose={() => setDialog(null)}
        >
          <p className="modal-description">
            {dialog === "increment"
              ? t(
                  "Этот шаг автоматически прибавляется к времени предыдущего пролива. Укажите 0 для одинаковой длительности.",
                )
              : session.status === "paused"
                ? t(
                    "Отсчёт начнётся заново с выбранного времени. История предыдущих проливов сохранится.",
                  )
                : t(
                    "Следующий пролив будет на {seconds} с дольше выбранного времени.",
                    { seconds: session.increment },
                  )}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (exactValid) {
                dispatch({
                  type:
                    dialog === "increment" ? "set-increment" : "set-duration",
                  seconds: Number(precise),
                });
                setDialog(null);
              }
            }}
          >
            <label className="duration-label" htmlFor="exact-duration">
              {dialog === "increment"
                ? t("Прибавка в секундах")
                : t("Длительность в секундах")}
            </label>
            <div className="duration-input">
              <input
                ref={durationInput}
                id="exact-duration"
                type="number"
                min={dialog === "increment" ? 0 : MIN_SECONDS}
                max={MAX_SECONDS}
                step="1"
                inputMode="numeric"
                value={precise}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setPrecise(event.target.value)}
              />
              <span>{t("секунд")}</span>
            </div>
            <p className="input-hint">
              {t("От {min} до 3 599 секунд (59:59)", {
                min: dialog === "increment" ? 0 : 1,
              })}
            </p>
            <button
              className="primary-button"
              type="submit"
              disabled={!exactValid}
            >
              {dialog === "increment"
                ? t("Сохранить шаг")
                : t("Сохранить время")}{" "}
              <Check size={18} />
            </button>
          </form>
        </Modal>
      )}
      {dialog === "restart" && (
        <Modal
          title={t("Начать этот пролив заново?")}
          onClose={() => setDialog(null)}
        >
          <p className="modal-description">
            {t(
              "Текущий отсчёт сбросится до {seconds} с. Перед запуском можно будет изменить время.",
              { seconds: session.duration },
            )}
          </p>
          <button className="primary-button" onClick={restart}>
            <RotateCcw size={18} /> {t("Начать заново")}
          </button>
          <button className="modal-cancel" onClick={() => setDialog(null)}>
            {t("Оставить как есть")}
          </button>
        </Modal>
      )}
      {dialog === "end" && (
        <Modal title={t("Завершить чаепитие?")} onClose={() => setDialog(null)}>
          <p className="modal-description">
            {t(
              "Текущая сессия и история проливов будут сброшены. Новый ритуал начнётся с чистого листа.",
            )}
          </p>
          <button
            className="primary-button"
            onClick={() => {
              setDialog(null);
              onEnd();
            }}
          >
            {t("Начать новое чаепитие")} <ArrowRight size={18} />
          </button>
          <button className="modal-cancel" onClick={() => setDialog(null)}>
            {t("Остаться с чаем")}
          </button>
        </Modal>
      )}
    </motion.main>
  );
}
