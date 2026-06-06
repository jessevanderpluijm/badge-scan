"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Status = "idle" | "valid" | "used" | "invalid";

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
}: {
  eventId: string;
  eventName: string;
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

  // Auto-focus the input and re-focus on any click / key press so the
  // hardware scanner always lands in the right place.
  useEffect(() => {
    inputRef.current?.focus();
    const refocus = () => inputRef.current?.focus();
    window.addEventListener("click", refocus);
    window.addEventListener("keydown", refocus);
    return () => {
      window.removeEventListener("click", refocus);
      window.removeEventListener("keydown", refocus);
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
    const { error: updateError } = await supabase
      .from("attendees")
      .update({ used_at: now })
      .eq("id", existing.id)
      .is("used_at", null);

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

    pushResult({
      status: "valid",
      barcode,
      attendee: { ...existing, used_at: now },
      at: Date.now(),
    });
    setStats((s) => ({ ...s, checkedIn: s.checkedIn + 1 }));
    setBusy(false);
  }

  function pushResult(r: ScanResult) {
    setCurrent(r);
    setHistory((h) => [r, ...h].slice(0, 20));
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
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
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
