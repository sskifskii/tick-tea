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
const openTea = async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Заварить Да Хун Пао" }));
  await screen.findByRole("heading", { name: /Да Хун Пао/, level: 1 });
};
describe("пользовательский интерфейс", () => {
  it("фильтрует каталог и восстанавливает его после пустого поиска", () => {
    render(<App />);
    expect(screen.getAllByRole("button", { name: /^Заварить/ })).toHaveLength(
      8,
    );
    fireEvent.click(screen.getByRole("button", { name: "Пуэр" }));
    expect(screen.getAllByRole("button", { name: /^Заварить/ })).toHaveLength(
      2,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Найти чай" }), {
      target: { value: "несуществующий" },
    });
    expect(screen.queryAllByRole("button", { name: /^Заварить/ })).toHaveLength(
      0,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Показать всю коллекцию/ }),
    );
    expect(screen.getAllByRole("button", { name: /^Заварить/ })).toHaveLength(
      8,
    );
  });
  it("меняет точное время, завершает пролив и показывает следующие 45 секунд", async () => {
    await openTea();
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
      "00:45",
    );
    expect(screen.getByRole("button", { name: "Начать пролив" })).toBeDefined();
    expect(screen.getByText("Пролив 01")).toBeDefined();
  });
  it("подтверждает перезапуск и защищает завершение от случайного нажатия", async () => {
    await openTea();
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
      screen.getByRole("button", { name: /Завершить и вернуться/ }),
    );
    await screen.findByRole("heading", { name: /Чайная коллекция/ });
    expect(screen.queryByRole("timer")).toBeNull();
  });
});
