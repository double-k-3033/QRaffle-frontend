import { atom } from "jotai";
import type { TickInfo, LatestStats } from "@/types";

export const tickInfoAtom = atom<TickInfo>({} as TickInfo);
export const latestStatsAtom = atom<LatestStats>({} as LatestStats);
export const latestTickAtom = atom<number>(0);
