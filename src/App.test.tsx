// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  );
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const openTimer = () => render(<App />);
describe("пользовательский интерфейс", () => {
  it("подстраивает окно ввода под видимую область при открытии клавиатуры и прокрутке", () => {
    const viewport = Object.assign(new EventTarget(), {
      height: 800,
      offsetTop: 0,
    });
    const removeListener = vi.spyOn(viewport, "removeEventListener");
    vi.stubGlobal("visualViewport", viewport);
    openTimer();
    fireEvent.click(screen.getByRole("button", { name: /Стартовое время/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.getPropertyValue("--viewport-height")).toBe("800px");
    viewport.height = 420;
    viewport.dispatchEvent(new Event("resize"));
    expect(dialog.style.getPropertyValue("--viewport-height")).toBe("420px");
    viewport.offsetTop = 50;
    viewport.dispatchEvent(new Event("scroll"));
    expect(dialog.style.getPropertyValue("--viewport-top")).toBe("50px");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Закрыть окно" }),
    );
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
  it.each([/Стартовое время/, /Прибавлять к проливу/, /Изменить время/])(
    "ставит фокус в поле после открытия через %s и возвращает его при закрытии",
    (name) => {
      openTimer();
      const trigger = screen.getByRole("button", { name });
      trigger.focus();
      fireEvent.click(trigger);
      const dialog = screen.getByRole("dialog");
      expect(document.activeElement).toBe(
        within(dialog).getByRole("spinbutton"),
      );
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Закрыть окно" }),
      );
      expect(document.activeElement).toBe(trigger);
    },
  );
  it("сразу открывает таймер без каталога и позволяет настроить шаг", () => {
    openTimer();
    expect(screen.getByRole("timer")).toBeDefined();
    expect(screen.queryByText("Чайная коллекция")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /Прибавлять к проливу/ }),
    );
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.submit(input.closest("form")!);
    expect(
      screen.getByRole("button", { name: /Прибавлять к проливу/ }).textContent,
    ).toContain("+0");
    expect(localStorage.length).toBe(0);
  });
  it("восстанавливает параметры и историю после обновления и очищает их для новой вкладки", () => {
    vi.useFakeTimers();
    const first = openTimer();
    fireEvent.click(screen.getByRole("button", { name: "Начать пролив" }));
    act(() => vi.advanceTimersByTime(30000));
    fireEvent.click(screen.getByRole("button", { name: "Следующий пролив" }));
    first.unmount();
    const restored = openTimer();
    expect(screen.getByText("Пролив 01")).toBeDefined();
    expect(screen.getByRole("timer").getAttribute("aria-label")).toContain(
      "00:35",
    );
    restored.unmount();
    sessionStorage.clear();
    openTimer();
    expect(screen.queryByText("Пролив 01")).toBeNull();
    expect(screen.getByRole("timer").getAttribute("aria-label")).toContain(
      "00:30",
    );
  });
  it("меняет точное время, завершает пролив и показывает следующие 35 секунд", async () => {
    openTimer();
    fireEvent.click(screen.getByRole("button", { name: /Изменить время/ }));
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "0" } });
    expect(
      (
        within(dialog).getByRole("button", {
          name: /Сохранить время/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.queryByRole("dialog")).toBeNull();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Начать пролив" }));
    expect(screen.getByRole("button", { name: "Пауза" })).toBeDefined();
    act(() => vi.advanceTimersByTime(30000));
    fireEvent.click(screen.getByRole("button", { name: "Следующий пролив" }));
    expect(screen.getByRole("timer").getAttribute("aria-label")).toContain(
      "00:35",
    );
    expect(screen.getByRole("button", { name: "Начать пролив" })).toBeDefined();
    expect(screen.getByText("Пролив 01")).toBeDefined();
  });
  it("подтверждает перезапуск и защищает завершение от случайного нажатия", async () => {
    openTimer();
    fireEvent.click(screen.getByRole("button", { name: "Начать пролив" }));
    fireEvent.click(screen.getByRole("button", { name: "Пауза" }));
    expect(screen.getByRole("button", { name: "Продолжить" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Заново" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Начать заново",
      }),
    );
    expect(screen.getByRole("button", { name: "Начать пролив" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Завершить чаепитие" }));
    fireEvent.click(screen.getByRole("button", { name: "Остаться с чаем" }));
    expect(screen.getByRole("button", { name: "Начать пролив" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Завершить чаепитие" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Начать новое чаепитие/ }),
    );
    expect(screen.getByRole("timer").getAttribute("aria-label")).toContain(
      "00:30",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Пролив 01")).toBeNull();
  });
});
