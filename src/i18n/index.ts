import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import en from "./locales/en";
import type { TranslationKey } from "./locales/en";
import ptBR from "./locales/pt-BR";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";
import ru from "./locales/ru";
import ko from "./locales/ko";
import zhCN from "./locales/zh-CN";
import ja from "./locales/ja";
import th from "./locales/th";

export type { TranslationKey };

export type Locale =
  | "en"
  | "pt-BR"
  | "es"
  | "fr"
  | "de"
  | "ru"
  | "ko"
  | "zh-CN"
  | "ja"
  | "th";

export const SUPPORTED_LOCALES: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português (BR)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ru", label: "Русский" },
  { value: "ko", label: "한국어" },
  { value: "zh-CN", label: "简体中文" },
  { value: "ja", label: "日本語" },
  { value: "th", label: "ไทย" },
];

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en,
  "pt-BR": ptBR,
  es,
  fr,
  de,
  ru,
  ko,
  "zh-CN": zhCN,
  ja,
  th,
};

const LOCALE_STORAGE_KEY = "overlay-poe-build.locale";

// ── Module-level state (works outside React) ──

let currentLocale: Locale = loadLocale();

function loadLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored in translations) {
      return stored as Locale;
    }
  } catch {
    // SSR or storage unavailable
  }
  return "en";
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

/**
 * Translate a key with optional interpolation params.
 * Works anywhere — inside or outside React components.
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template =
    translations[currentLocale]?.[key] ?? translations.en[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, paramKey: string) => String(params[paramKey] ?? `{{${paramKey}}}`),
  );
}

/** Get the current locale (module-level). */
export function getLocale(): Locale {
  return currentLocale;
}

/** Set the current locale (module-level). */
export function setLocale(locale: Locale) {
  currentLocale = locale;
  persistLocale(locale);
}

// ── React integration ──

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof t;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);

  const changeLocale = useCallback((next: Locale) => {
    setLocale(next);
    setLocaleState(next);
    // Sync to Electron main process for tray/dialog strings
    window.desktop?.setLocale(next);
  }, []);

  // Sync across windows via storage events
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY || !event.newValue) {
        return;
      }

      if (event.newValue in translations) {
        const next = event.newValue as Locale;
        currentLocale = next;
        setLocaleState(next);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const contextT = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      // Close over `locale` so React re-renders when it changes
      const template =
        translations[locale]?.[key] ?? translations.en[key] ?? key;

      if (!params) {
        return template;
      }

      return template.replace(
        /\{\{(\w+)\}\}/g,
        (_, paramKey: string) =>
          String(params[paramKey] ?? `{{${paramKey}}}`),
      );
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale: changeLocale, t: contextT }),
    [locale, changeLocale, contextT],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

/**
 * React hook: returns `{ t, locale, setLocale }`.
 * Components re-render when the locale changes.
 */
export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
