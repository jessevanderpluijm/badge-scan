"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPrinterStatus, type PrinterStatus } from "@/lib/print-agent";

// One shared auto-print preference for the whole browser: the scanner page,
// the attendee list and the manual check-in dialog all read the same value.
const KEY = "badgescan-autoprint";
const EVT = "badgescan-autoprint-changed";

export function readAutoPrint(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function useAutoPrint(): [boolean, () => void] {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(readAutoPrint());
    const sync = () => setOn(readAutoPrint());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, readAutoPrint() ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(EVT));
  }, []);

  return [on, toggle];
}

export function usePrinterStatus(pollMs = 10000): PrinterStatus | null {
  const [status, setStatus] = useState<PrinterStatus | null>(null);
  useEffect(() => {
    let active = true;
    const ping = async () => {
      const s = await getPrinterStatus();
      if (active) setStatus(s);
    };
    ping();
    const timer = setInterval(ping, pollMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pollMs]);
  return status;
}

// Prominent printer status + auto-print switch. Green and calm when the
// printer is reachable; loud when it isn't — the printer is essential at
// the door, so a broken link should be impossible to miss.
export function PrinterControls({ className }: { className?: string }) {
  const status = usePrinterStatus();
  const [autoPrint, toggleAutoPrint] = useAutoPrint();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border px-4 py-2.5",
        status === "no-agent" && "border-destructive/60 bg-destructive/5",
        status === "printer-off" && "border-warning/70 bg-warning/10",
        (status === "ready" || status === null) && "bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {status === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground flex-shrink-0" />
        ) : status === "ready" ? (
          <span className="relative flex-shrink-0">
            <Printer className="h-5 w-5 text-success" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success" />
          </span>
        ) : status === "printer-off" ? (
          <Printer className="h-5 w-5 text-warning flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
        )}
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-medium truncate">
            {status === null
              ? "Printer zoeken…"
              : status === "ready"
                ? "Printer verbonden"
                : status === "printer-off"
                  ? "Printer uit of niet bereikbaar"
                  : "Printerkoppeling niet actief"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {status === "no-agent"
              ? "Check-in werkt door · start de printerkoppeling op deze laptop"
              : status === "printer-off"
                ? "Zet de printer aan — de koppeling draait"
                : autoPrint
                  ? "Badges printen automatisch bij check-in"
                  : "Automatisch printen staat uit"}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none">
        <span className="text-xs font-medium text-muted-foreground">
          Auto-print
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={autoPrint}
          onClick={toggleAutoPrint}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            autoPrint ? "bg-success" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              autoPrint ? "translate-x-[22px]" : "translate-x-0.5",
            )}
          />
        </button>
      </label>
    </div>
  );
}
