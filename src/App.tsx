import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  Download,
  Leaf,
  Settings2,
  Smartphone,
  Volume2,
  Vibrate,
  WifiOff,
} from "lucide-react";
import { useTeaSession } from "./hooks/useTeaSession";
import { Brewing } from "./components/Brewing";
import { Modal } from "./components/Modal";
import { unlockAudio } from "./lib/feedback";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function App() {
  const controller = useTeaSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Перейти к содержимому
        </a>
        <header className="site-header page-width">
          <div className="brand" aria-label="tick tea">
            <span className="brand-mark">
              <Leaf size={23} strokeWidth={1.5} />
            </span>
            <span>
              tick<span className="brand-space">tea</span>
              <span className="brand-dot">.</span>
            </span>
          </div>
          <span className="header-caption">ВРЕМЯ ЧАЯ</span>
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
          <Brewing
            session={controller.session}
            dispatch={controller.dispatch}
            onEnd={controller.endSession}
          />
        </div>
        <footer className="site-footer page-width">
          <span>
            tick tea<span className="brand-dot">.</span>
          </span>
          <span>authored by sskifskii</span>
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
      </div>
    </MotionConfig>
  );
}
