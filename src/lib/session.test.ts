import { describe, expect, it } from "vitest";
import { teas } from "../data/teas";
import {
  clampDuration,
  createSession,
  formatTime,
  MAX_SECONDS,
  nextDuration,
  reconcile,
  remainingAt,
  transition,
} from "./session";
const tea = teas[0];
const first = () => createSession(tea);
const finished = (duration = 40) => {
  let s = transition(first(), { type: "set-duration", seconds: duration });
  s = transition(s, { type: "start", now: 1000 });
  return transition(s, { type: "tick", now: 1000 + duration * 1000 });
};
describe("длительность", () => {
  it("первый пролив Да Хун Пао — 40 секунд", () => {
    expect(first()).toMatchObject({
      infusion: 1,
      duration: 40,
      remainingMs: 40000,
      status: "idle",
      history: [],
    });
  });
  it("рассчитывает 40 → 55 → 70", () => {
    expect(nextDuration(40, 15)).toBe(55);
    expect(nextDuration(55, 15)).toBe(70);
  });
  it("использует вручную уменьшенное время: 40 → 30 → 45", () => {
    let s = transition(finished(), { type: "next", increment: 15 });
    expect(s.duration).toBe(55);
    s = transition(s, { type: "set-duration", seconds: 30 });
    s = transition(s, { type: "start", now: 50000 });
    s = transition(s, { type: "tick", now: 80000 });
    expect(s.history).toEqual([
      { number: 1, duration: 40 },
      { number: 2, duration: 30 },
    ]);
    s = transition(s, { type: "next", increment: 15 });
    expect(s).toMatchObject({ duration: 45, infusion: 3, status: "idle" });
  });
  it("использует вручную увеличенное время", () => {
    expect(
      transition(finished(60), { type: "next", increment: 15 }).duration,
    ).toBe(75);
  });
  it("ограничивает ноль, отрицательные, дробные, бесконечные и большие значения", () => {
    expect([-5, 0, NaN, Infinity].map(clampDuration)).toEqual([1, 1, 1, 1]);
    expect(clampDuration(5.7)).toBe(6);
    expect(clampDuration(9999)).toBe(MAX_SECONDS);
    expect(nextDuration(MAX_SECONDS, 15)).toBe(MAX_SECONDS);
  });
  it("не позволяет редактировать работающий таймер", () => {
    const s = transition(first(), { type: "start", now: 0 });
    expect(transition(s, { type: "set-duration", seconds: 5 })).toBe(s);
  });
});
describe("переходы таймера", () => {
  it("ставит точный timestamp окончания", () => {
    expect(transition(first(), { type: "start", now: 1500 }).endsAt).toBe(
      41500,
    );
  });
  it("пауза сохраняет миллисекунды; продолжение создаёт новый срок", () => {
    let s = transition(first(), { type: "start", now: 1000 });
    s = transition(s, { type: "pause", now: 13250 });
    expect(s).toMatchObject({
      status: "paused",
      remainingMs: 27750,
      endsAt: null,
    });
    expect(remainingAt(s, 999999)).toBe(27750);
    s = transition(s, { type: "start", now: 50000 });
    expect(s.endsAt).toBe(77750);
    expect(remainingAt(s, 50250)).toBe(27500);
  });
  it("завершает при паузе после фактического срока", () => {
    const s = transition(first(), { type: "start", now: 0 });
    expect(transition(s, { type: "pause", now: 50000 }).status).toBe(
      "completed",
    );
  });
  it("догоняет время после долгой неактивности без отрицательных значений", () => {
    const s = transition(first(), { type: "start", now: 1000 });
    expect(remainingAt(s, 999999)).toBe(0);
    expect(reconcile(s, 999999)).toMatchObject({
      status: "completed",
      infusion: 1,
      remainingMs: 0,
      endsAt: null,
      history: [{ number: 1, duration: 40 }],
    });
  });
  it("не завершает раньше времени", () => {
    const s = transition(first(), { type: "start", now: 1000 });
    expect(reconcile(s, 40999)).toBe(s);
  });
  it("не показывает больше заданной длительности при переводе часов назад", () => {
    const s = transition(first(), { type: "start", now: 50000 });
    expect(remainingAt(s, 1000)).toBe(40000);
  });
  it("не повышает номер при завершении; следующий пролив не стартует автоматически", () => {
    const s = finished();
    expect(s.infusion).toBe(1);
    expect(transition(s, { type: "next", increment: 15 })).toMatchObject({
      infusion: 2,
      status: "idle",
      remainingMs: 55000,
      endsAt: null,
    });
  });
  it("повторные быстрые нажатия не стартуют и не переходят дважды", () => {
    const running = transition(first(), { type: "start", now: 0 });
    expect(transition(running, { type: "start", now: 1000 })).toBe(running);
    const next = transition(finished(), { type: "next", increment: 15 });
    expect(transition(next, { type: "next", increment: 15 })).toBe(next);
    const complete = finished();
    expect(transition(complete, { type: "tick", now: 999999 })).toBe(complete);
  });
  it("перезапуск сбрасывает отсчёт, сохраняя номер и длительность", () => {
    let s = transition(first(), { type: "start", now: 0 });
    s = transition(s, { type: "pause", now: 10000 });
    s = transition(s, { type: "restart" });
    expect(s).toMatchObject({
      status: "idle",
      remainingMs: 40000,
      infusion: 1,
      duration: 40,
      history: [],
    });
    expect(transition(s, { type: "set-duration", seconds: 20 }).duration).toBe(
      20,
    );
  });
  it("перезапуск завершённого пролива не дублирует историю", () => {
    let s = transition(finished(), { type: "restart" });
    expect(s.history).toEqual([]);
    s = transition(s, { type: "start", now: 50000 });
    s = transition(s, { type: "tick", now: 90000 });
    expect(s.history).toEqual([{ number: 1, duration: 40 }]);
  });
  it("невозможные переходы не меняют состояние", () => {
    const s = first();
    expect(transition(s, { type: "next", increment: 15 })).toBe(s);
    expect(transition(s, { type: "pause", now: 1000 })).toBe(s);
  });
  it("новая сессия не наследует старую историю", () => {
    const s = createSession(teas[2]);
    expect(s).toMatchObject({
      teaId: "shu-puer",
      infusion: 1,
      duration: 15,
      status: "idle",
      history: [],
    });
  });
  it("форматирует секунды округляя вверх", () => {
    expect(formatTime(39901)).toBe("00:40");
    expect(formatTime(70000)).toBe("01:10");
    expect(formatTime(-2)).toBe("00:00");
    expect(formatTime(3599000)).toBe("59:59");
  });
});
