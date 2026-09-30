import { useEffect, useState } from "react";

export type ViewportMode = "compact" | "medium" | "wide";

export type ViewportState = {
  width: number;
  height: number;
  mode: ViewportMode;
  isCompact: boolean;
  isMedium: boolean;
  isWide: boolean;
};

function resolveMode(width: number): ViewportMode {
  if (width < 900) return "compact";
  if (width < 1180) return "medium";
  return "wide";
}

export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    const mode = resolveMode(width);
    return {
      width,
      height,
      mode,
      isCompact: mode === "compact",
      isMedium: mode === "medium",
      isWide: mode === "wide",
    };
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mode = resolveMode(width);
      setState({
        width,
        height,
        mode,
        isCompact: mode === "compact",
        isMedium: mode === "medium",
        isWide: mode === "wide",
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return state;
}
