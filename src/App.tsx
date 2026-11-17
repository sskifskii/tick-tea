import {
  LanguageContext,
  useLanguage,
  useLanguageController,
} from "./hooks/useLanguage";
import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  Download,
  Leaf,
  Languages,
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
  const language = useLanguageController();
  return (
    <LanguageContext.Provider value={language}>
      <AppContent />
    </LanguageContext.Provider>
  );
}

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
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
          {t("Перейти к содержимому")}
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
          <span className="header-caption">{t("ВРЕМЯ ЧАЯ")}</span>
          <div className="header-actions">
            {!online && (
              <span className="offline-label">
                <WifiOff size={15} />
                <span>{t("Офлайн")}</span>
              </span>
            )}
            {!installed && (
              <button
                className="install-button"
                onClick={() => setSettingsOpen(true)}
              >
                <Download size={16} />
                <span>{t("Установить")}</span>
              </button>
            )}
            <button
              className="icon-button settings-button"
              aria-label={t("Настройки приложения")}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>
        {!controller.storageAvailable && (
          <div className="storage-warning" role="status">
            {t(
              "Браузер не разрешает сохранить сессию. Не закрывайте вкладку во время чаепития.",
            )}
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
          <span>{t("автор — sskifskii")}</span>
        </footer>
        <div className="sr-only" role="status" aria-live="polite">
          {controller.session?.status === "completed"
            ? t("Пролив {infusion} завершён. Можно разливать чай.", {
                infusion: controller.session.infusion,
              })
            : ""}
        </div>
        {settingsOpen && (
          <Modal
            title={t("Ваш тихий уголок")}
            onClose={() => setSettingsOpen(false)}
          >
            <p className="modal-description">
              {t("Немного настроек для вашего ритуала.")}
            </p>
            <div className="setting-row">
              <Languages size={21} />
              <label className="language-label" htmlFor="app-language">
                {t("Язык")}
              </label>
              <select
                id="app-language"
                className="language-select"
                aria-label={t("Язык приложения")}
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value === "en" ? "en" : "ru")
                }
              >
                <option value="ru" lang="ru">
                  Русский
                </option>
                <option value="en" lang="en">
                  English
                </option>
              </select>
            </div>
            <div className="setting-row">
              <Volume2 size={21} />
              <div>
                <strong>{t("Мягкий звук")}</strong>
                <small>{t("Колокольчик в конце пролива")}</small>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={controller.settings.sound}
                aria-label={t("Звук завершения")}
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
                <strong>{t("Вибрация")}</strong>
                <small>
                  {"vibrate" in navigator
                    ? t("Тихое напоминание в ладони")
                    : t("Недоступна в этом браузере")}
                </small>
              </div>
              <button
                className="switch"
                role="switch"
                aria-checked={controller.settings.vibration}
                aria-label={t("Вибрация завершения")}
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
              {t(
                "В свёрнутой вкладке браузер может задержать сигнал. При возвращении время и состояние пролива восстановятся.",
              )}
            </p>
            <div className="install-panel">
              <Smartphone size={25} />
              <h3>
                {installed
                  ? t("Ваш ритуал всегда рядом")
                  : t("Место для чая на вашем экране")}
              </h3>
              <p>
                {installed
                  ? t("Приложение уже открыто в самостоятельном режиме.")
                  : t(
                      "Установите tick tea и заваривайте без лишних вкладок. После первой загрузки приложение доступно без интернета.",
                    )}
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
                  {t("Установить приложение")} <Download size={17} />
                </button>
              ) : (
                !installed && (
                  <p className="install-instructions">
                    {t("На iPhone: Safari → «Поделиться» → «На экран Домой».")}
                    <br />
                    {t(
                      "На Android и компьютере: меню браузера → «Установить приложение» или «Добавить на главный экран».",
                    )}
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
