import type { ComponentType } from "react";
import { GeckoHero } from "./GeckoHero";

/** Add the new case's SVG here; no game logic changes are needed. */
export const sketchArt: Record<string, ComponentType> = { gecko_hero: GeckoHero };
