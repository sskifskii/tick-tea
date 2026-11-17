import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Leaf,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Thermometer,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import type { Tea } from "../data/teas";
import type { Session, SessionAction } from "../lib/session";
import { MAX_SECONDS, MIN_SECONDS, nextDuration } from "../lib/session";
import { Timer } from "./Timer";
import { TeaArt } from "./TeaArt";
import { Modal } from "./Modal";
import { unlockAudio } from "../lib/feedback";

export function Brewing({
  tea,
  session,
  dispatch,
  onBack,
  onEnd,
}: {
  tea: Tea;
  session: Session;
  dispatch: (action: SessionAction) => void;
  onBack: () => void;
  onEnd: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const [dialog, setDialog] = useState<"time" | "restart" | "end" | null>(null);
  const [precise, setPrecise] = useState(String(session.duration));
  const canEdit = session.status === "idle";
  const completed = session.status === "completed";
  const labels = {
    idle: "Начать пролив",
    running: "Пауза",
    paused: "Продолжить",
    completed: "Следующий пролив",
  };
  const primary = () => {
    unlockAudio();
    if (completed) dispatch({ type: "next", increment: tea.increment });
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
    Number(precise) >= MIN_SECONDS &&
    Number(precise) <= MAX_SECONDS;
  return (
    <motion.main
      className="brewing page-width"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={17} /> Чайная коллекция
      </button>
      <div className="brew-heading">
        <div>
          <div className="eyebrow">
            {tea.category} <span> / </span> {tea.region}
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {tea.name}
            <span className="brew-chinese">{tea.chinese}</span>
          </h1>
        </div>
        <span className="session-badge">
          <span className="status-dot" /> ВАШ ЧАЙНЫЙ РИТУАЛ
        </span>
      </div>
      <div className="brew-layout">
        <section className="brew-main" aria-label="Таймер заваривания">
          <div className="brew-specs">
            <div>
              <Thermometer size={19} />
              <span>
                <strong>
                  {tea.temperature}
                  <small> °C</small>
                </strong>
                <span>температура</span>
              </span>
            </div>
            <div>
              <Leaf size={19} />
              <span>
                <strong>
                  {tea.grams}
                  <small> г / 100 мл</small>
                </strong>
                <span>количество чая</span>
              </span>
            </div>
            <div>
              <Clock3 size={19} />
              <span>
                <strong>
                  +{tea.increment}
                  <small> с</small>
                </strong>
                <span>шаг пролива</span>
              </span>
            </div>
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
                ? `Следующий — ${nextDuration(session.duration, tea.increment)} с. Начните, когда будете готовы.`
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
          <section className="tea-story">
            <div
              className="story-visual"
              style={{ "--tea-color": tea.color } as React.CSSProperties}
            >
              <TeaArt tea={tea} />
              <span>{tea.chinese}</span>
            </div>
            <div className="eyebrow">ХАРАКТЕР ВАШЕГО ЧАЯ</div>
            <h2>{tea.description}</h2>
            <div className="taste-notes">
              {tea.notes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>
            <div className="recommendation">
              <Leaf size={18} />
              <p>{tea.recommendation}</p>
            </div>
            <p className="recipe-note">
              Рецепт — ориентир для гайвани. Время можно менять перед каждым
              проливом.
            </p>
          </section>
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
              <span className="status-dot" /> Сохраняется на этом устройстве
            </div>
          </section>
        </aside>
      </div>
      {dialog === "time" && (
        <Modal title="Время вашего пролива" onClose={() => setDialog(null)}>
          <p className="modal-description">
            Доверьтесь вкусу. Следующий пролив будет на {tea.increment} с дольше
            выбранного времени.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (exactValid) {
                dispatch({ type: "set-duration", seconds: Number(precise) });
                setDialog(null);
              }
            }}
          >
            <label className="duration-label" htmlFor="exact-duration">
              Длительность в секундах
            </label>
            <div className="duration-input">
              <input
                id="exact-duration"
                type="number"
                min={MIN_SECONDS}
                max={MAX_SECONDS}
                step="1"
                inputMode="numeric"
                value={precise}
                onChange={(event) => setPrecise(event.target.value)}
                autoFocus
              />
              <span>секунд</span>
            </div>
            <p className="input-hint">От 1 до 3 599 секунд (59:59)</p>
            <button
              className="primary-button"
              type="submit"
              disabled={!exactValid}
            >
              Сохранить время <Check size={18} />
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
          <button className="primary-button" onClick={onEnd}>
            Завершить и вернуться к чаям <ArrowRight size={18} />
          </button>
          <button className="modal-cancel" onClick={() => setDialog(null)}>
            Остаться с чаем
          </button>
        </Modal>
      )}
    </motion.main>
  );
}
