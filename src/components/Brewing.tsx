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
import { motion } from "motion/react";
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
  const heading = useRef<HTMLHeadingElement>(null);
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
    idle: "Начать пролив",
    running: "Пауза",
    paused: "Продолжить",
    completed: "Следующий пролив",
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
      <div className="brew-heading">
        <div>
          <div className="eyebrow">ВРЕМЯ ДЛЯ ЧАЯ</div>
          <h1 ref={heading} tabIndex={-1}>
            Ваш момент спокойствия
          </h1>
        </div>
        <span className="session-badge">
          <span className="status-dot" /> ВАШ ЧАЙНЫЙ РИТУАЛ
        </span>
      </div>
      <div className="brew-layout">
        <section className="brew-main" aria-label="Таймер заваривания">
          <div className="timer-parameters">
            <button
              disabled={!canEdit}
              onClick={() => {
                setPrecise(String(session.duration));
                setDialog("time");
              }}
            >
              <span>
                {session.infusion === 1 ? "Стартовое время" : "Текущий пролив"}
              </span>
              <strong>
                {session.duration}
                <small> с</small>
              </strong>
            </button>
            <button
              onClick={() => {
                setPrecise(String(session.increment));
                setDialog("increment");
              }}
            >
              <span>Прибавлять к проливу</span>
              <strong>
                +{session.increment}
                <small> с</small>
              </strong>
            </button>
          </div>
          <Timer session={session} />
          <div
            className={`quick-adjust ${canEdit ? "" : "quick-adjust--locked"}`}
          >
            <button
              aria-label="Уменьшить время на 5 секунд"
              disabled={!canEdit || session.duration === MIN_SECONDS}
              onClick={() =>
                dispatch({
                  type: "set-duration",
                  seconds: session.duration - 5,
                })
              }
            >
              <Minus size={15} />5 с
            </button>
            <button
              className="time-edit"
              disabled={!canEdit}
              onClick={() => {
                setPrecise(String(session.duration));
                setDialog("time");
              }}
            >
              <SlidersHorizontal size={15} /> Изменить время
            </button>
            <button
              aria-label="Увеличить время на 5 секунд"
              disabled={!canEdit || session.duration === MAX_SECONDS}
              onClick={() =>
                dispatch({
                  type: "set-duration",
                  seconds: session.duration + 5,
                })
              }
            >
              <Plus size={15} />5 с
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
                ? `Следующий — ${nextDuration(session.duration, session.increment)} с. Начните, когда будете готовы.`
                : session.status === "running"
                  ? "Вдохните. Всё идёт своим чередом."
                  : session.status === "paused"
                    ? "Продолжите или начните этот пролив заново."
                    : "Залейте воду и нажмите, чтобы начать."}
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
                <RotateCcw size={15} /> Заново
              </button>
              <span />
              <button onClick={() => setDialog("end")}>
                <X size={15} /> Завершить чаепитие
              </button>
            </div>
          </div>
        </section>
        <aside className="brew-sidebar">
          <section className="history" aria-labelledby="history-title">
            <div className="history-heading">
              <h2 id="history-title">История проливов</h2>
              <span>{String(session.history.length).padStart(2, "0")}</span>
            </div>
            {session.history.length === 0 ? (
              <p className="history-empty">
                Первый глоток ещё впереди.
                <br />
                Здесь появится история вашего чаепития.
              </p>
            ) : (
              <ol>
                {session.history.map((item) => (
                  <li key={item.number}>
                    <span>
                      <Check size={14} /> Пролив{" "}
                      {String(item.number).padStart(2, "0")}
                    </span>
                    <strong>
                      {item.duration} <small>с</small>
                    </strong>
                  </li>
                ))}
              </ol>
            )}
            <div className="history-foot">
              <span className="status-dot" /> Сохраняется в этой вкладке до её
              закрытия
            </div>
          </section>
        </aside>
      </div>
      {(dialog === "time" || dialog === "increment") && (
        <Modal
          title={
            dialog === "increment"
              ? "Шаг между проливами"
              : "Время вашего пролива"
          }
          onClose={() => setDialog(null)}
        >
          <p className="modal-description">
            {dialog === "increment"
              ? "Этот шаг автоматически прибавляется к времени предыдущего пролива. Укажите 0 для одинаковой длительности."
              : session.status === "paused"
                ? "Отсчёт начнётся заново с выбранного времени. История предыдущих проливов сохранится."
                : `Следующий пролив будет на ${session.increment} с дольше выбранного времени.`}
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
                ? "Прибавка в секундах"
                : "Длительность в секундах"}
            </label>
            <div className="duration-input">
              <input
                id="exact-duration"
                type="number"
                min={dialog === "increment" ? 0 : MIN_SECONDS}
                max={MAX_SECONDS}
                step="1"
                inputMode="numeric"
                value={precise}
                onChange={(event) => setPrecise(event.target.value)}
                autoFocus
              />
              <span>секунд</span>
            </div>
            <p className="input-hint">
              От {dialog === "increment" ? 0 : 1} до 3 599 секунд (59:59)
            </p>
            <button
              className="primary-button"
              type="submit"
              disabled={!exactValid}
            >
              {dialog === "increment" ? "Сохранить шаг" : "Сохранить время"}{" "}
              <Check size={18} />
            </button>
          </form>
        </Modal>
      )}
      {dialog === "restart" && (
        <Modal
          title="Начать этот пролив заново?"
          onClose={() => setDialog(null)}
        >
          <p className="modal-description">
            Текущий отсчёт сбросится до {session.duration} с. Перед запуском
            можно будет изменить время.
          </p>
          <button className="primary-button" onClick={restart}>
            <RotateCcw size={18} /> Начать заново
          </button>
          <button className="modal-cancel" onClick={() => setDialog(null)}>
            Оставить как есть
          </button>
        </Modal>
      )}
      {dialog === "end" && (
        <Modal title="Завершить чаепитие?" onClose={() => setDialog(null)}>
          <p className="modal-description">
            Текущая сессия и история проливов будут сброшены. Новый ритуал
            начнётся с чистого листа.
          </p>
          <button
            className="primary-button"
            onClick={() => {
              setDialog(null);
              onEnd();
            }}
          >
            Начать новое чаепитие <ArrowRight size={18} />
          </button>
          <button className="modal-cancel" onClick={() => setDialog(null)}>
            Остаться с чаем
          </button>
        </Modal>
      )}
    </motion.main>
  );
}
