"use client";

import { createContext, useContext } from "react";

interface StepActionsContextType {
  actionBarEl: HTMLDivElement | null;
  onOpenAiConfig: () => void;
}

export const StepActionsContext = createContext<StepActionsContextType>({
  actionBarEl: null,
  onOpenAiConfig: () => {},
});

export function useStepActions() {
  return useContext(StepActionsContext);
}
