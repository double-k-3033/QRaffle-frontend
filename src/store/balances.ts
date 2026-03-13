import { atom } from "jotai";

type Balance = {
  id: string;
  balance: number;
  validForTick: number;
  latestIncomingTransferTick: number;
  latestOutgoingTransferTick: number;
  incomingAmount: number;
  outgoingAmount: number;
  numberOfIncomingTransfers: number;
  numberOfOutgoingTransfers: number;
};

export const balancesAtom = atom<Balance[]>([]);
