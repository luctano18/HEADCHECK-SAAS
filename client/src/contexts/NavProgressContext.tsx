import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type StepStatus = "done" | "current" | "upcoming";

export interface StepSummary {
  id: number;
  label: string;         // short step name, e.g. "Feelings" or "Values"
  description?: string;  // optional one-line description
  status: StepStatus;
}

export interface NavProgress {
  current: number;          // current step (0 = not started / intro)
  total: number;            // total steps
  label: string;            // e.g. "Check-In" or "Compass"
  color: string;            // CSS gradient string
  active: boolean;          // whether to show the indicator
  steps: StepSummary[];     // ordered list of all steps for the summary panel
  isLoadingSteps: boolean;  // true while step metadata is being prepared
}

interface NavProgressContextValue {
  progress: NavProgress;
  setProgress: (p: Partial<Omit<NavProgress, "steps">> & { steps?: StepSummary[] }) => void;
  clearProgress: () => void;
}

const DEFAULT: NavProgress = {
  current: 0,
  total: 0,
  label: "",
  color: "linear-gradient(90deg, #7c3aed, #ec4899)",
  active: false,
  steps: [],
  isLoadingSteps: false,
};

const NavProgressContext = createContext<NavProgressContextValue>({
  progress: DEFAULT,
  setProgress: () => {},
  clearProgress: () => {},
});

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<NavProgress>(DEFAULT);

  const setProgress = useCallback(
    (p: Partial<Omit<NavProgress, "steps">> & { steps?: StepSummary[] }) => {
      setProgressState((prev) => ({ ...prev, ...p, active: true }));
    },
    []
  );

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
