import { t, contentText, getLanguage, subscribe } from "../../i18n/index.ts";
import bank from "./objects.json" with { type: "json" };

export interface SpaceObject {
  id: string;
  name: string;
  label: string;
  diameterKm: number;
  measure: string;
  fact: string;
  art: string;
  rangeKm?: number[];
}

function spaceObjects(): readonly SpaceObject[] {
  return [...bank].sort((a, b) => a.diameterKm - b.diameterKm).map(obj => {
    const text = (field: string) => contentText("space." + obj.id + "." + field);
    return { ...obj, name: text("name"), label: text("label"), fact: text("fact") };
  });
}
export let objects = spaceObjects();
subscribe(() => { objects = spaceObjects(); });
export const stopCount = objects.length - 1;
const logStops = objects.map(({ diameterKm }) => Math.log10(diameterKm));
const number = { format(value: number) { return value.toLocaleString(getLanguage() === "kk" ? "kk-KZ" : "en-US", { maximumFractionDigits: 1 }); } };

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function cameraScale(progress: number, focusPx: number) {
  const position = clamp(progress, 0, 1) * stopCount;
  const from = Math.min(Math.floor(position), stopCount - 1);
  const logSize = logStops[from] + (logStops[from + 1] - logStops[from]) * (position - from);
  return 10 ** logSize / focusPx;
}

export function screenSize(diameterKm: number, kmPerPixel: number, viewportPx: number) {
  return clamp(diameterKm / kmPerPixel, 2, viewportPx * .9);
}

function formatCompact(value: number) {
  if (value >= 1e9) return t("scale.billion", { value1: number.format(value / 1e9) });
  if (value >= 1e6) return t("scale.million", { value1: number.format(value / 1e6) });
  return number.format(value);
}

export function formatSize(km: number) {
  if (km < 1) return t("scale.m", { value1: number.format(km * 1000) });
  const rounded = km >= 1000 && km < 1e6 ? Number(km.toPrecision(3)) : km;
  return t("scale.km", { value1: formatCompact(rounded) });
}

export function sizeRatio(a: SpaceObject, b: SpaceObject) {
  return Math.max(a.diameterKm, b.diameterKm) / Math.min(a.diameterKm, b.diameterKm);
}

export function compareSizes(a: SpaceObject, b: SpaceObject) {
  const [big, small] = a.diameterKm > b.diameterKm ? [a, b] : [b, a];
  const ratio = sizeRatio(a, b);
  const amount = formatCompact(ratio < 10 ? ratio : ratio < 1000 ? Math.round(ratio) : Number(ratio.toPrecision(2)));
  const name = big.label.charAt(0).toUpperCase() + big.label.slice(1);
  return t("scale.isAboutTimesAsBigAs", { name, amount, value3: small.label });
}
