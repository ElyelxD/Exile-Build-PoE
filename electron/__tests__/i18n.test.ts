import { describe, it, expect, vi } from "vitest";

vi.mock("electron", () => ({
  app: { getPath: () => "/tmp/exile-build-poe-test" },
}));

// Persistence is not what these tests are about; keep them off the filesystem.
vi.mock("node:fs", () => ({
  default: {
    readFileSync: () => {
      throw new Error("no locale file");
    },
    writeFileSync: () => {},
    mkdirSync: () => {},
  },
}));

import { getLocale, isSupportedLocale, saveLocale, t } from "../i18n";
import { SUPPORTED_LOCALES } from "@/i18n";

/**
 * Regression suite. This exists because the main process gated `app:set-locale`
 * on a hard-coded `en | pt-BR`, while the renderer offered ten languages and
 * electron/i18n.ts already carried complete dictionaries for all ten. Picking
 * any other language silently left the tray, the exit dialog and every import
 * error in the previous language.
 *
 * Contract:
 *   - Every locale the renderer offers must be accepted by the main process.
 *   - Anything else is rejected rather than stored.
 *   - t() renders the active locale, and returns the key when nothing defines it.
 *   - {{param}} placeholders are interpolated.
 */

describe("isSupportedLocale", () => {
  it("accepts every locale the renderer offers in its language picker", () => {
    const rejected = SUPPORTED_LOCALES.map((entry) => entry.value).filter(
      (value) => !isSupportedLocale(value),
    );

    expect(rejected).toEqual([]);
  });

  it("rejects values that are not locales", () => {
    expect(isSupportedLocale("klingon")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
    expect(isSupportedLocale("EN")).toBe(false);
  });

  it("does not treat inherited Object properties as locales", () => {
    expect(isSupportedLocale("toString")).toBe(false);
    expect(isSupportedLocale("constructor")).toBe(false);
  });
});

describe("t", () => {
  it("renders the string for the active locale", () => {
    saveLocale("pt-BR");
    expect(getLocale()).toBe("pt-BR");
    expect(t("electron.trayQuit")).toBe("Sair");

    saveLocale("de");
    expect(t("electron.trayQuit")).toBe("Beenden");
  });

  it("returns the key itself when no dictionary defines it", () => {
    saveLocale("en");
    expect(t("electron.doesNotExist")).toBe("electron.doesNotExist");
  });

  it("interpolates named parameters", () => {
    saveLocale("en");
    expect(t("electron.downloadFailed", { status: 404 })).toContain("404");
  });

  it("leaves a placeholder intact when its parameter is missing", () => {
    saveLocale("en");
    expect(t("electron.downloadFailed")).toContain("{{status}}");
  });
});
