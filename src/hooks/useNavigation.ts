import { useState, useCallback, createContext, useContext } from "react";

export type Screen = "main" | "add" | "edit" | "filter" | "help";

export interface NavigationState {
  screen: Screen;
  params: Record<string, string>;
}

export interface NavigationContextType {
  screen: Screen;
  params: Record<string, string>;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
  goBack: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  screen: "main",
  params: {},
  navigate: () => {},
  goBack: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

export function useNavigationState(): NavigationContextType {
  const [history, setHistory] = useState<NavigationState[]>([
    { screen: "main", params: {} },
  ]);

  const current = history[history.length - 1]!;

  const navigate = useCallback((screen: Screen, params: Record<string, string> = {}) => {
    setHistory((prev) => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return {
    screen: current.screen,
    params: current.params,
    navigate,
    goBack,
  };
}
