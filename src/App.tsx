import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import {
  ArrowRight,
  Download,
  Leaf,
  Settings2,
  Smartphone,
  Volume2,
  Vibrate,
  WifiOff,
} from "lucide-react";
import { getTea } from "./data/teas";
import type { Tea } from "./data/teas";
import { useTeaSession } from "./hooks/useTeaSession";
import { Catalog } from "./components/Catalog";
import { Brewing } from "./components/Brewing";
import { Modal } from "./components/Modal";
import { unlockAudio } from "./lib/feedback";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function App() {
  const controller = useTeaSession();
  const [screen, setScreen] = useState<"catalog" | "brewing">(() =>
    controller.session ? "brewing" : "catalog",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingTea, setPendingTea] = useState<Tea | null>(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [installed, setInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches,
  );
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const onlineChange = () => setOnline(navigator.onLine);
    const installChange = () => {
      setInstalled(true);
      setInstall(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installChange);
    window.addEventListener("online", onlineChange);
    window.addEventListener("offline", onlineChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installChange);
      window.removeEventListener("online", onlineChange);
      window.removeEventListener("offline", onlineChange);
    };
  }, []);
  const select = (tea: Tea) => {
    if (controller.session && controller.session.teaId !== tea.id) {
      setPendingTea(tea);
      return;
    }
    if (!controller.session) controller.selectTea(tea);
    setScreen("brewing");
    window.scrollTo(0, 0);
  };
  const tea = controller.session && getTea(controller.session.teaId);
  const end = () => {
    controller.endSession();
    setScreen("catalog");
    window.scrollTo(0, 0);
  };
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Перейти к содержимому
        </a>
        <header className="site-header page-width">
          <button
            className="brand"
            aria-label="tick tea — к коллекции чаёв"
            onClick={() => {
              setScreen("catalog");
              window.scrollTo(0, 0);
            }}
          >
            <span className="brand-mark">
              <Leaf size={23} strokeWidth={1.5} />
            </span>
            <span>
              tick<span className="brand-space">tea</span>
              <span className="brand-dot">.</span>
            </span>
          </button>
          <span className="header-caption">ВРЕМЯ БЫТЬ ЗДЕСЬ</span>
          <div className="header-actions">
            {!online && (
              <span className="offline-label">
                <WifiOff size={15} />
                <span>Офлайн</span>
              </span>
            )}
            {!installed && (
              <button
                className="install-button"
                onClick={() => setSettingsOpen(true)}
              >
                <Download size={16} />
                <span>Установить</span>
              </button>
            )}
            <button
              className="icon-button settings-button"
              aria-label="Настройки приложения"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>
        {!controller.storageAvailable && (
          <div className="storage-warning" role="status">
            Браузер не разрешает сохранить сессию. Не закрывайте вкладку во
            время чаепития.
          </div>
        )}
        <div id="main-content" tabIndex={-1}>
          <AnimatePresence mode="wait">
            {screen === "brewing" && controller.session && tea ? (
              <Brewing
                key={`brewing-${tea.id}`}
                tea={tea}
                session={controller.session}
                dispatch={controller.dispatch}
                onBack={() => setScreen("catalog")}
                onEnd={end}
              />
            ) : (
              <Catalog
                key="catalog"
                session={controller.session}
                onSelect={select}
                onResume={() => setScreen("brewing")}
              />
            )}
          </AnimatePresence>
        </div>
        <footer className="site-footer page-width">
          <span>
            tick tea<span className="brand-dot">.</span>{" "}
            <span className="footer-divider">/</span> Сделайте паузу. Заварите
            чай.
          </span>
          <span>Никакой спешки. Только настоящий момент.</span>
        </footer>
        <div className="sr-only" role="status" aria-live="polite">
          {controller.session?.status === "completed"
            ? `Пролив ${controller.session.infusion} завершён. Можно разливать чай.`
            : ""}
        </div>
        {settingsOpen && (
          <Modal
            title="Ваш тихий уголок"
            onClose={() => setSettingsOpen(false)}
          >
            <p className="modal-description">
              Немного настроек для вашего ритуала.
            </p>
            <div className="setting-row">
              <Volume2 size={21} />
              <div>
                <strong>Мягкий звук</strong>
                <small>Колокольчик в конце пролива</small>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={controller.settings.sound}
                aria-label="Звук завершения"
                onClick={() => {
                  unlockAudio();
                  controller.setSettings({
                    ...controller.settings,
                    sound: !controller.settings.sound,
                  });
                }}
              >
                <span />
              </button>
            </div>
            <div className="setting-row">
              <Vibrate size={21} />
              <div>
                <strong>Вибрация</strong>
                <small>
                  {"vibrate" in navigator
                    ? "Тихое напоминание в ладони"
                    : "Недоступна в этом браузере"}
                </small>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={controller.settings.vibration}
                aria-label="Вибрация завершения"
                disabled={!("vibrate" in navigator)}
                onClick={() =>
                  controller.setSettings({
                    ...controller.settings,
                    vibration: !controller.settings.vibration,
                  })
                }
              >
                <span />
              </button>
            </div>
            <p className="settings-note">
              В свёрнутой вкладке браузер может задержать сигнал. При
              возвращении время и состояние пролива восстановятся.
            </p>
            <div className="install-panel">
              <Smartphone size={25} />
              <h3>
                {installed
                  ? "Ваш ритуал всегда рядом"
                  : "Место для чая на вашем экране"}
              </h3>
              <p>
                {installed
                  ? "Приложение уже открыто в самостоятельном режиме."
                  : "Установите tick tea и заваривайте без лишних вкладок. После первой загрузки приложение доступно без интернета."}
              </p>
              {install ? (
                <button
                  className="primary-button"
                  onClick={async () => {
                    try {
                      await install.prompt();
                      await install.userChoice;
                    } catch {
                      // При отказе браузера остаётся инструкция ручной установки.
                    } finally {
                      setInstall(null);
                    }
                  }}
                >
                  Установить приложение <Download size={17} />
                </button>
              ) : (
                !installed && (
                  <p className="install-instructions">
                    На iPhone: Safari → «Поделиться» → «На экран Домой».
                    <br />
                    На Android и компьютере: меню браузера → «Установить
                    приложение» или «Добавить на главный экран».
                  </p>
                )
              )}
            </div>
          </Modal>
        )}
        {pendingTea && (
          <Modal
            title="Начать новое чаепитие?"
            onClose={() => setPendingTea(null)}
          >
            <p className="modal-description">
              Текущая сессия и её история будут сброшены. Начнём заваривать{" "}
              {pendingTea.name}?
            </p>
            <button
              className="primary-button"
              onClick={() => {
                controller.selectTea(pendingTea);
                setPendingTea(null);
                setScreen("brewing");
                window.scrollTo(0, 0);
              }}
            >
              Начать новое чаепитие <ArrowRight size={18} />
            </button>
            <button
              className="modal-cancel"
              onClick={() => setPendingTea(null)}
            >
              Оставить текущий чай
            </button>
          </Modal>
        )}
      </div>
    </MotionConfig>
  );
}
