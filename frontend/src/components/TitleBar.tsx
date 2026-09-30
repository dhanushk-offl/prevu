import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "@phosphor-icons/react";

type TitleBarProps = {
  title?: string;
};

function detectMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Macintosh/i.test(ua);
}

export default function TitleBar({ title = "PREVU" }: TitleBarProps) {
  const isMac = useMemo(() => detectMac(), []);
  const [maximized, setMaximized] = useState(false);

  const refreshMaximized = useCallback(async () => {
    try {
      setMaximized(await getCurrentWindow().isMaximized());
    } catch {
      // ignore when running in a plain browser
    }
  }, []);

  useEffect(() => {
    refreshMaximized();
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        unlisten = await getCurrentWindow().onResized(() => {
          refreshMaximized();
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      unlisten?.();
    };
  }, [refreshMaximized]);

  const minimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch {
      // ignore
    }
  };

  const toggleMaximize = async () => {
    try {
      await getCurrentWindow().toggleMaximize();
      await refreshMaximized();
    } catch {
      // ignore
    }
  };

  const close = async () => {
    try {
      await getCurrentWindow().close();
    } catch {
      // ignore
    }
  };

  const TrafficLights = (
    <div className="flex items-center gap-2 pl-1">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] hover:brightness-95"
      >
        <X size={8} weight="bold" className="opacity-0 text-[#4d0000] group-hover:opacity-100" />
      </button>
      <button
        type="button"
        aria-label="Minimize"
        onClick={minimize}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] hover:brightness-95"
      >
        <Minus size={8} weight="bold" className="opacity-0 text-[#5c4100] group-hover:opacity-100" />
      </button>
      <button
        type="button"
        aria-label={maximized ? "Restore" : "Maximize"}
        onClick={toggleMaximize}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] hover:brightness-95"
      >
        <Square size={7} weight="bold" className="opacity-0 text-[#0b3d12] group-hover:opacity-100" />
      </button>
    </div>
  );

  const WindowsControls = (
    <div className="flex h-full items-stretch">
      <button
        type="button"
        aria-label="Minimize"
        onClick={minimize}
        className="flex h-8 w-11 items-center justify-center text-slate-600 transition hover:bg-[#e8e8e8]"
      >
        <Minus size={14} weight="bold" />
      </button>
      <button
        type="button"
        aria-label={maximized ? "Restore" : "Maximize"}
        onClick={toggleMaximize}
        className="flex h-8 w-11 items-center justify-center text-slate-600 transition hover:bg-[#e8e8e8]"
      >
        <Square size={12} weight="bold" />
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="flex h-8 w-11 items-center justify-center text-slate-600 transition hover:bg-rose-500 hover:text-white"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );

  return (
    <div
      data-tauri-drag-region
      className="relative flex h-8 shrink-0 select-none items-center border-b border-[var(--line)] bg-[#f3f3f3]"
    >
      <div className="z-10 flex h-full w-[108px] items-center px-3">
        {isMac ? TrafficLights : <span className="sr-only">Window controls</span>}
      </div>

      <div data-tauri-drag-region className="pointer-events-none absolute inset-x-0 flex items-center justify-center">
        <p className="text-[12px] font-medium tracking-wide text-slate-700">{title}</p>
      </div>

      <div className="z-10 ml-auto flex h-full w-[108px] items-center justify-end">
        {isMac ? null : WindowsControls}
      </div>
    </div>
  );
}
