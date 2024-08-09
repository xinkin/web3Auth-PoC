import { create } from "zustand";
import { BiconomySmartAccountV2 } from "@biconomy/account";

interface SmartAccountState {
  smartAccount: BiconomySmartAccountV2 | null;
  smartAccountAddress: string | null;
  setSmartAccount: (smartAccount: BiconomySmartAccountV2 | null) => void;
  setSmartAccountAddress: (address: string | null) => void;
}

export const useSmartAccountStore = create<SmartAccountState>((set) => ({
  smartAccount: null,
  smartAccountAddress: null,
  setSmartAccount: (smartAccount) => set({ smartAccount }),
  setSmartAccountAddress: (smartAccountAddress) => set({ smartAccountAddress }),
}));
