import { DEFAULT_TICK_OFFSET } from "@/utils/constants";
import { atom } from "jotai";

export type Settings = {
  tickOffset: number;
};

const parsedLocalSettings = JSON.parse(
  localStorage.getItem("settings") || `{"tickOffset": ${DEFAULT_TICK_OFFSET}}`,
) as Partial<Settings> | null;

const normalizeTickOffset = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : DEFAULT_TICK_OFFSET;
};

const localStorageSettings: Settings = {
  tickOffset: normalizeTickOffset(parsedLocalSettings?.tickOffset),
};

export const settingsAtom = atom(
  localStorageSettings || {
    tickOffset: DEFAULT_TICK_OFFSET,
  },
  (get, set, update: Partial<Settings>) => {
    const newSettings = {
      ...get(settingsAtom),
      ...update,
      tickOffset: normalizeTickOffset(update.tickOffset ?? get(settingsAtom).tickOffset),
    };
    set(settingsAtom, newSettings);
    localStorage.setItem("settings", JSON.stringify(newSettings));
  },
);
