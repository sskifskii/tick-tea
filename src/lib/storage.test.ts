import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession, transition } from "./session";
import {
  decodeState,
  defaultSettings,
  loadState,
  saveState,
  STORAGE_KEY,
} from "./storage";
const pack = (session: unknown) =>
  JSON.stringify({ version: 2, session, settings: defaultSettings });
afterEach(() => vi.unstubAllGlobals());
describe("сохранение и восстановление", () => {
  it("восстанавливает активный таймер на 70 секунд без сброса", () => {
    let s = transition(createSession(40, 15), {
      type: "set-duration",
      seconds: 70,
    });
    s = transition(s, { type: "start", now: 100000 });
    expect(decodeState(pack(s), 120000).session).toEqual(s);
    expect(decodeState(pack(s), 171000).session).toMatchObject({
      infusion: 1,
      status: "completed",
      duration: 70,
      history: [{ number: 1, duration: 70 }],
    });
  });
  it("восстанавливает паузу независимо от прошедшего времени", () => {
    let s = transition(createSession(40, 15), { type: "start", now: 1000 });
    s = transition(s, { type: "pause", now: 15000 });
    expect(decodeState(pack(s), 999999).session).toEqual(s);
  });
  it("восстанавливает ручную корректировку и историю", () => {
    let s = transition(createSession(40, 15), { type: "start", now: 0 });
    s = transition(s, { type: "tick", now: 40000 });
    s = transition(s, { type: "next" });
    s = transition(s, { type: "set-duration", seconds: 30 });
    expect(decodeState(pack(s)).session).toEqual(s);
  });
  it.each([
    null,
    "",
    "{broken",
    "null",
    "[]",
    "42",
    '{"version":1}',
    '{"version":1,"session":{}}',
  ])("безопасно обрабатывает повреждённую запись %s", (raw) => {
    expect(decodeState(raw).session).toEqual(createSession());
  });
  it("отбрасывает неверный шаг, нулевое время и некорректный timestamp", () => {
    const s = createSession(40, 15);
    for (const bad of [
      { ...s, increment: -1 },
      { ...s, increment: 1.5 },
      { ...s, increment: 99999 },
      { ...s, duration: 0 },
      { ...s, status: "running", endsAt: null },
      { ...s, status: "running", endsAt: 1e100 },
      { ...s, remainingMs: -1 },
      { ...s, status: "impossible" },
      { ...s, status: ["idle"] },
      { ...s, history: [{ number: 1, duration: 40 }] },
      { ...s, status: "paused", remainingMs: 0 },
      { ...s, infusion: 1.5 },
      {
        ...s,
        status: "completed",
        remainingMs: 0,
        history: [{ number: 1, duration: 99999 }],
      },
    ])
      expect(decodeState(pack(bad)).session).toEqual(createSession());
  });
  it("при завершении после восстановления история записывается один раз", () => {
    const s = transition(createSession(40, 15), { type: "start", now: 1000 });
    const saved = decodeState(pack(s), 50000);
    expect(
      decodeState(JSON.stringify(saved), 60000).session?.history,
    ).toHaveLength(1);
  });
  it("сохраняет пользовательские настройки", () => {
    expect(
      decodeState(
        JSON.stringify({
          version: 2,
          session: createSession(),
          settings: { sound: false, vibration: false },
        }),
      ).settings,
    ).toEqual({ sound: false, vibration: false });
  });
  it("обрабатывает отказ sessionStorage", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("quota");
      },
    });
    expect(loadState().session).toEqual(createSession());
    expect(
      saveState({
        version: 2,
        session: createSession(),
        settings: defaultSettings,
      }),
    ).toBe(false);
  });
  it("явный сброс сохраняется и не возобновляет старую сессию", () => {
    let raw: string | null = pack(createSession(40, 15));
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => (key === STORAGE_KEY ? raw : null),
      setItem: (_key: string, value: string) => {
        raw = value;
      },
    });
    expect(
      saveState({
        version: 2,
        session: createSession(),
        settings: defaultSettings,
      }),
    ).toBe(true);
    expect(loadState().session).toEqual(createSession());
  });
});
