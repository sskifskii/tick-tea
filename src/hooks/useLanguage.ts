import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../lib/translations";

export type Language = "ru" | "en";
type TranslationKey = keyof typeof translations;
type Parameters = Record<string, string | number>;
export const LANGUAGE_KEY = "tick-tea:language";

function translate(
  language: Language,
  key: TranslationKey,
  parameters: Parameters = {},
) {
  const text = language === "en" ? translations[key] : key;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    parameters[name] === undefined ? placeholder : String(parameters[name]),
  );
}

function loadLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ru";
  } catch {
    return "ru";
  }
}

export function useLanguageController() {
  const [language, updateLanguage] = useState<Language>(loadLanguage);
  const t = (key: TranslationKey, parameters?: Parameters) =>
    translate(language, key, parameters);
  const setLanguage = (next: Language) => {
    updateLanguage(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // Language switching still works when storage is unavailable.
    }
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "tick tea — время для чая");
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute(
        "href",
        `${import.meta.env.BASE_URL}${language === "en" ? "manifest.en.webmanifest" : "manifest.webmanifest"}`,
      );
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        translate(
          language,
          "Маленькая пауза, большой ритуал. Задайте время и шаг проливов. Точный таймер с историей текущего чаепития, который работает офлайн.",
        ),
      );
  }, [language]);
  return { language, setLanguage, t };
}

export const LanguageContext = createContext<ReturnType<
  typeof useLanguageController
> | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageContext is missing");
  return context;
}
