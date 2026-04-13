import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface NavProgress {
  current: number;   // current step (0 = not started / intro)
  total: number;     // total steps
  label: string;     // e.g. "Check-In" or "Compass"
  color: string;     // tailwind gradient or hex
  active: boolean;   // whether to show the indicator
}

interface NavProgressContextValue {
  progress: NavProgress;
  setProgress: (p: Partial<NavProgress>) => void;
  clearProgress: () => void;
}

const DEFAULT: NavProgress = {
  current: 0,
  total: 0,
  label: "",
  color: "linear-gradient(90deg, #7c3aed, #ec4899)",
  active: false,
};

const NavProgressContext = createContext<NavProgressContextValue>({
  progress: DEFAULT,
  setProgress: () => {},
  clearProgress: () => {},
});

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<NavProgress>(DEFAULT);

  const setProgress = useCallback((p: Partial<NavProgress>) => {
    setProgressState((prev) => ({ ...prev, ...p, active: true }));
  }, []);

  const clearProgress = useCallback(() => {
    setProgressState(DEFAULT);
  }, []);

  return (
    <NavProgressContext.Provider value={{ progress, setProgress, clearProgress }}>
      {children}
    </NavProgressContext.Provider>
  );
}

export function useNavProgress() {
  return useContext(NavProgressContext);
}
