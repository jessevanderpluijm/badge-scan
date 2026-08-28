"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ScanLine,
  Printer,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type BadgeDesign, type AttendeeForBadge } from "@/lib/badge";
import { printBadge } from "@/lib/print-agent";
import {
  PrinterControls,
  useAutoPrint,
  usePrinterOnline,
} from "@/components/printer-controls";

type Status = "idle" | "valid" | "used" | "invalid";

type PrintState =
  | { state: "idle" }
  | { state: "printing" }
  | { state: "done"; jobId: string }
  | { state: "error"; message: string };

type Attendee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  job_title: string | null;
  barcode: string;
  used_at: string | null;
};

type ScanResult = {
  status: Status;
  barcode: string;
  attendee: Attendee | null;
  previousUsedAt?: string | null;
  at: number;
};

type Stats = { checkedIn: number; invalid: number; duplicate: number };

export function Scanner({
  eventId,
  eventName,
  design,
}: {
  eventId: string;
  eventName: string;
  design: BadgeDesign;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [current, setCurrent] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState<Stats>({
    checkedIn: 0,
    invalid: 0,
    duplicate: 0,
  });
  const [busy, setBusy] = useState(false);

  // Shared printer status + auto-print preference (same control lives on
  // the attendee list page; localStorage keeps them in sync).
  const agentOnline = usePrinterOnline();
  const [autoPrint] = useAutoPrint();
  const [printState, setPrintState] = useState<PrintState>({ state: "idle" });

  async function printFor(attendee: AttendeeForBadge) {
    setPrintState({ state: "printing" });
    const result = await printBadge(design, attendee);
    if (result.ok) {
      setPrintState({ state: "done", jobId: result.jobId });
    } else {
      setPrintState({ state: "error", message: result.error });
    }
  }

  // Auto-focus the input so the hardware scanner lands here, and re-claim
  // focus when it slips to the body — but stay out of the way of dialogs,
  // other inputs, and keyboard shortcuts (Cmd/Ctrl/Alt).
  useEffect(() => {
    inputRef.current?.focus();

    function isClaimable(target: Element | null) {
      if (!target) return true;
      if (target === inputRef.current) return false;
      // Don't fight another input / button / dialog for focus.
      if (target.closest('[role="dialog"], input, textarea, select, button, [contenteditable="true"]')) {
        return false;
      }
      return true;
    }

    function onClick(e: MouseEvent) {
      if (isClaimable(document.activeElement)) inputRef.current?.focus();
      // Note: we intentionally don't preventDefault — a deliberate click on
      // a link or button still works.
      void e;
    }

    function onKeydown(e: KeyboardEvent) {
      // Let copy/paste/devtools/etc through.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isClaimable(document.activeElement)) inputRef.current?.focus();
    }

    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeydown);
    };
  }, []);

  async function handleScan(raw: string) {
    const barcode = raw.trim();
    if (!barcode || busy) return;
    setBusy(true);
    setValue("");

    const { data: existing, error: selectError } = await supabase
      .from("attendees")
      .select(
        "id, first_name, last_name, email, company, job_title, barcode, used_at",
      )
      .eq("event_id", eventId)
      .eq("barcode", barcode)
      .maybeSingle();

    if (selectError) {
      pushResult({
        status: "invalid",
        barcode,
        attendee: null,
        at: Date.now(),
      });
      setBusy(false);
      return;
    }

    if (!existing) {
      pushResult({
        status: "invalid",
        barcode,
        attendee: null,
        at: Date.now(),
      });
      setStats((s) => ({ ...s, invalid: s.invalid + 1 }));
      setBusy(false);
      return;
    }

    if (existing.used_at) {
      pushResult({
        status: "used",
        barcode,
        attendee: existing,
        previousUsedAt: existing.used_at,
        at: Date.now(),
      });
      setStats((s) => ({ ...s, duplicate: s.duplicate + 1 }));
      setBusy(false);
      return;
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("attendees")
      .update({ used_at: now })
      .eq("id", existing.id)
      .is("used_at", null)
      .select("id, used_at");

    if (updateError) {
      pushResult({
        status: "invalid",
        barcode,
        attendee: existing,
        at: Date.now(),
      });
      setBusy(false);
      return;
    }

    // No rows updated means another scanner station beat us to it between
    // our SELECT and UPDATE. Treat as a duplicate so this station gets
    // honest feedback instead of a misleading "valid" green screen.
    if (!updated || updated.length === 0) {
      pushResult({
        status: "used",
        barcode,
        attendee: existing,
        previousUsedAt: now,
        at: Date.now(),
      });
      setStats((s) => ({ ...s, duplicate: s.duplicate + 1 }));
      setBusy(false);
      return;
    }

    pushResult({
      status: "valid",
      barcode,
      attendee: { ...existing, used_at: now },
      at: Date.now(),
    });
    setStats((s) => ({ ...s, checkedIn: s.checkedIn + 1 }));
    setBusy(false);

    // Fire the badge print after the check-in result is already on screen —
    // the queue keeps moving even if the printer is slow or offline.
    if (autoPrint) {
      void printFor(existing);
    }
  }

  function pushResult(r: ScanResult) {
    setCurrent(r);
    setHistory((h) => [r, ...h].slice(0, 20));
    setPrintState({ state: "idle" });
  }

  const palette = {
    valid: {
      bg: "bg-success",
      text: "text-success-foreground",
      Icon: CheckCircle2,
      label: "Valid",
    },
    used: {
      bg: "bg-warning",
      text: "text-warning-foreground",
      Icon: AlertTriangle,
      label: "Already checked in",
    },
    invalid: {
      bg: "bg-destructive",
      text: "text-destructive-foreground",
      Icon: XCircle,
      label: "Invalid barcode",
    },
    idle: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      Icon: ScanLine,
      label: "Ready",
    },
  } as const;

  const display = current
    ? palette[current.status]
    : palette.idle;

  return (
    <div className="flex-1 flex flex-col">
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-6 py-10 transition-colors duration-200",
          display.bg,
          display.text,
        )}
      >
        <div
          key={current?.at ?? "idle"}
          className={cn(
            "flex flex-col items-center text-center max-w-2xl w-full",
            current && "animate-pulse-once",
          )}
        >
          <display.Icon
            className="h-24 w-24 sm:h-32 sm:w-32 mb-4"
            strokeWidth={1.5}
          />
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            {display.label}
          </h2>

          {current?.status === "valid" && current.attendee && (
            <div className="mt-6 space-y-1">
              <p className="text-2xl sm:text-3xl font-semibold">
                {[current.attendee.first_name, current.attendee.last_name]
                  .filter(Boolean)
                  .join(" ") || "Attendee"}
              </p>
              {(current.attendee.job_title || current.attendee.company) && (
                <p className="text-lg opacity-90">
                  {[current.attendee.job_title, current.attendee.company]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {current.attendee.email && (
                <p className="text-base opacity-80">
                  {current.attendee.email}
                </p>
              )}
            </div>
          )}

          {current?.status === "used" && current.attendee && (
            <div className="mt-6 space-y-1">
              <p className="text-2xl sm:text-3xl font-semibold">
                {[current.attendee.first_name, current.attendee.last_name]
                  .filter(Boolean)
                  .join(" ") || "Attendee"}
              </p>
              <p className="text-base opacity-90">
                Checked in at{" "}
                {current.previousUsedAt
                  ? new Date(current.previousUsedAt).toLocaleTimeString()
                  : "earlier"}
              </p>
            </div>
          )}

          {current?.status === "invalid" && (
            <p className="mt-6 text-base opacity-90">
              No attendee with this barcode exists for {eventName}.
            </p>
          )}

          {(current?.status === "valid" || current?.status === "used") &&
            current.attendee && (
              <div className="mt-5 flex flex-col items-center gap-2 text-sm">
                {printState.state === "printing" && (
                  <span className="inline-flex items-center gap-2 opacity-90">
                    <Loader2 className="h-4 w-4 animate-spin" /> Badge wordt
                    geprint…
                  </span>
                )}
                {printState.state === "done" && (
                  <span className="inline-flex items-center gap-2 opacity-90">
                    <Printer className="h-4 w-4" /> Badge naar de printer ✓
                  </span>
                )}
                {printState.state === "error" && (
                  <span className="inline-flex items-center gap-2 opacity-90">
                    <AlertTriangle className="h-4 w-4" /> Badge niet geprint:{" "}
                    {printState.message}
                  </span>
                )}
                {printState.state !== "printing" && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-inherit"
                    onClick={() =>
                      current.attendee && printFor(current.attendee)
                    }
                  >
                    <Printer className="h-4 w-4" />
                    {printState.state === "done" || current.status === "used"
                      ? "Print badge opnieuw"
                      : "Print badge"}
                  </Button>
                )}
              </div>
            )}

          {current && (
            <p className="mt-6 text-xs font-mono opacity-70 break-all">
              {current.barcode}
            </p>
          )}

          {!current && (
            <p className="mt-6 text-sm opacity-80">
              Scan a barcode to check in.
            </p>
          )}
        </div>
      </div>

      <div className="border-t bg-background px-4 sm:px-8 py-4">
        <PrinterControls className="max-w-2xl mx-auto mb-3" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan(value);
          }}
          className="max-w-2xl mx-auto"
        >
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Waiting for scanner…"
            className="h-12 text-center text-base font-mono"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span>{stats.checkedIn} valid</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span>{stats.duplicate} duplicate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span>{stats.invalid} invalid</span>
            </span>
          </div>
        </form>

        {history.length > 0 && (
          <div className="max-w-2xl mx-auto mt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Recent
            </p>
            <ul className="space-y-1">
              {history.slice(0, 6).map((r) => (
                <li
                  key={r.at}
                  className="flex items-center justify-between gap-3 text-sm py-1.5 border-b last:border-b-0"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {r.status === "valid" && (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    )}
                    {r.status === "used" && (
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                    )}
                    {r.status === "invalid" && (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {r.attendee
                        ? [
                            r.attendee.first_name,
                            r.attendee.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") || r.attendee.email || r.barcode
                        : r.barcode}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(r.at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
