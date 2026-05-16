import { useEffect, useState, useCallback } from "react";

const KEY = "megsy:sidebar-collapsed";
const EVT = "megsy:sidebar-collapsed-changed";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function useSidebarCollapsed(): [boolean, (v: boolean) => void, () => void] {
  const [collapsed, setCollapsedState] = useState<boolean>(() => read());

  useEffect(() => {
    const onChange = () => setCollapsedState(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch {}
    setCollapsedState(v);
    window.dispatchEvent(new Event(EVT));
  }, []);

  const toggle = useCallback(() => setCollapsed(!read()), [setCollapsed]);

  return [collapsed, setCollapsed, toggle];
}
