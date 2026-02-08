import { createContext, useContext } from "react";

export const PlatformContext = createContext(null);

export function usePlatform() {
  const ctx = useContext(PlatformContext);

  if (!ctx) {
    throw new Error("usePlatform must be used inside PlatformProvider");
  }

  return ctx;
}
