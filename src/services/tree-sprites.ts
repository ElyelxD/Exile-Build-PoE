/**
 * Loads and caches the GGG passive tree sprite sheets.
 * Sprite sheets are fetched from web.poecdn.com on first use
 * and cached in memory for subsequent draws.
 */

import treeRaw from "@/data/tree-default.json";

interface SheetUrls {
  active: string;
  inactive: string;
  mastery: string;
  masteryActive: string;
  masteryInactive: string;
  frame: string;
  jewel: string;
  groupBackground: string;
  startNode: string;
  line: string;
  ascendancy: string;
  bloodline: string;
  background: string;
}

const sheets = (treeRaw as { sheets: SheetUrls }).sheets;

export type SheetKey = keyof SheetUrls;

const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  if (!url) return Promise.reject(new Error("Empty URL"));

  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);

  const existing = loadingPromises.get(url);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // No crossOrigin — Electron loads from file:// origin and poecdn
    // doesn't send CORS headers, so "anonymous" would block the request.
    img.onload = () => {
      imageCache.set(url, img);
      loadingPromises.delete(url);
      resolve(img);
    };
    img.onerror = () => {
      loadingPromises.delete(url);
      reject(new Error(`Failed to load sprite: ${url}`));
    };
    img.src = url;
  });

  loadingPromises.set(url, promise);
  return promise;
}

export function getSheet(key: SheetKey): HTMLImageElement | null {
  return imageCache.get(sheets[key]) ?? null;
}

export function isLoaded(key: SheetKey): boolean {
  return imageCache.has(sheets[key]);
}

/** Critical sheets that must load for the tree to render. */
const CRITICAL_SHEETS: SheetKey[] = ["active", "inactive", "frame"];

/** Start loading all sprite sheets. Rejects if critical sheets fail. */
export async function loadAllSheets(): Promise<void> {
  const urls = Object.values(sheets).filter(Boolean);
  // Deduplicate (groupBackground and startNode share the same PNG)
  const unique = [...new Set(urls)];
  const results = await Promise.allSettled(unique.map(loadImage));

  const failedUrls: string[] = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      failedUrls.push(unique[i]);
    }
  }

  if (failedUrls.length === 0) return;

  // Check if any critical sheet failed
  const criticalUrls = CRITICAL_SHEETS.map((k) => sheets[k]);
  const criticalFailed = failedUrls.some((url) => criticalUrls.includes(url));

  if (criticalFailed) {
    throw new Error(`Failed to load critical tree sprites (${failedUrls.length} sheet(s) failed)`);
  }
}

/** Start loading core sheets (active icons + frames). Lighter than loadAll. */
export async function loadCoreSheets(): Promise<void> {
  const core: SheetKey[] = ["active", "inactive", "frame"];
  const results = await Promise.allSettled(core.map((k) => loadImage(sheets[k])));

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      console.warn("[tree-sprites] Failed to load:", core[i]);
    }
  }
}
