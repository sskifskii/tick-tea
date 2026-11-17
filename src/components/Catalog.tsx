import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Leaf,
  Search,
  Thermometer,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { categories, teas } from "../data/teas";
import type { Tea } from "../data/teas";
import type { Session } from "../lib/session";
import { getTea } from "../data/teas";
import { TeaArt, RitualArt } from "./TeaArt";

export function Catalog({
  onSelect,
  session,
  onResume,
}: {
  onSelect: (tea: Tea) => void;
  session: Session | null;
  onResume: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const [filter, setFilter] = useState("Все чаи");
  const [query, setQuery] = useState("");
  const shown = teas.filter(
    (tea) =>
      (filter === "Все чаи" || tea.category === filter) &&
      `${tea.name} ${tea.description} ${tea.notes.join(" ")}`
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  const activeTea = session && getTea(session.teaId);
  return (
    <motion.main
      className="catalog page-width"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> МАЛЕНЬКАЯ ПАУЗА. БОЛЬШОЙ РИТУАЛ.
          </div>
          <h1 id="hero-title" ref={heading} tabIndex={-1}>
            У каждого чая
            <br />
            своё <span>время.</span>
          </h1>
          <p>
            Вода, листья и немного внимания.
            <br />
            Всё остальное мы возьмём на себя.
          </p>
          <div className="hero-foot">
            <span className="status-dot" /> В ритме гунфу{" "}
            <span className="hero-separator">/</span> Без спешки
          </div>
        </div>
        <RitualArt />
      </section>
      {session && activeTea && (
        <button className="resume-banner" onClick={onResume}>
          <span className="resume-icon">
            <Clock3 size={21} />
          </span>
          <span>
            <strong>Ваш чай ещё здесь</strong>
            <small>
              {activeTea.name} · Пролив {session.infusion}
              {session.status === "completed"
                ? " завершён"
                : session.status === "paused"
                  ? " на паузе"
                  : ""}
            </small>
          </span>
          <ArrowRight size={21} />
        </button>
      )}
      <section className="collection" aria-labelledby="collection-title">
        <div className="collection-heading">
          <div>
            <div className="eyebrow">НАЙДИТЕ СВОЁ НАСТРОЕНИЕ</div>
            <h2 id="collection-title">
              Чайная коллекция
              <span className="count">
                {String(teas.length).padStart(2, "0")}
              </span>
            </h2>
          </div>
          <p className="collection-caption">
            Знакомые чаи.
            <br />
            Новые моменты.
          </p>
        </div>
        <div className="catalog-tools">
          <div className="filters" aria-label="Категории чая">
            {["Все чаи", ...categories].map((category) => (
              <button
                key={category}
                aria-pressed={filter === category}
                onClick={() => setFilter(category)}
                className={filter === category ? "filter active" : "filter"}
              >
                {category === "Все чаи" && <Leaf size={14} />}
                {category}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Найти чай"
              placeholder="Найти свой чай"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button aria-label="Очистить поиск" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            )}
          </label>
        </div>
        <div className="tea-grid">
          {shown.map((tea, i) => (
            <motion.button
              className="tea-card"
              aria-label={`Заварить ${tea.name}`}
              key={tea.id}
              onClick={() => onSelect(tea)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.15), duration: 0.3 }}
              style={{ "--tea-color": tea.color } as React.CSSProperties}
            >
              <div className="tea-visual">
                <span className="tea-category">{tea.category}</span>
                <span className="tea-chinese">{tea.chinese}</span>
                <TeaArt tea={tea} />
                <span className="card-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </div>
              <div className="tea-card-body">
                <div className="tea-region">{tea.region}</div>
                <h3>{tea.name}</h3>
                <p>{tea.description}</p>
                <div className="taste-notes">
                  {tea.notes.slice(0, 2).map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
                <div className="tea-specs">
                  <span>
                    <Thermometer size={14} />
                    {tea.temperature}°
                  </span>
                  <span>
                    <Leaf size={14} />
                    {tea.grams} г / 100 мл
                  </span>
                  <span>
                    <Clock3 size={14} />
                    {tea.initialTime} с
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="empty-state">
            <Leaf size={28} />
            <h3>Этот чай пока не нашёлся</h3>
            <p>Попробуйте другое название или категорию.</p>
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setFilter("Все чаи");
              }}
            >
              Показать всю коллекцию <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      <div className="catalog-note">
        <span className="note-symbol">茶</span>
        <p>
          Хороший чай начинается с внимания, а не с правил.
          <br />
          <span>Наши рецепты — отправная точка. Доверьтесь своему вкусу.</span>
        </p>
      </div>
    </motion.main>
  );
}
