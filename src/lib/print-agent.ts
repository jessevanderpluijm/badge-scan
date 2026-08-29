"use client";

// Client for the local Badge Scan print agent (scripts/print-agent.mjs).
// The agent runs on the check-in laptop itself and bridges the browser to
// the USB-connected Epson C4000e. Browsers allow HTTPS pages to call
// http://127.0.0.1, so this works from the hosted portal without setup.
//
// Every function here fails soft: printing is a bonus on top of check-in,
// never a blocker.

import {
  generateBadgePdf,
  type AttendeeForBadge,
  type BadgeDesign,
} from "@/lib/badge";

const AGENT_URL = "http://127.0.0.1:9123";

export type PrintResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

// "ready"       → agent draait én de fysieke printer is bereikbaar
// "printer-off" → agent draait, maar de printer staat uit / kabel los / vastgelopen
// "no-agent"    → geen printerkoppeling op deze laptop
export type PrinterStatus = "ready" | "printer-off" | "no-agent";

export async function getPrinterStatus(): Promise<PrinterStatus> {
  try {
    const res = await fetch(`${AGENT_URL}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return "no-agent";
    const body = (await res.json().catch(() => ({}))) as {
      printerOnline?: boolean;
    };
    return body.printerOnline === false ? "printer-off" : "ready";
  } catch {
    return "no-agent";
  }
}

export async function checkPrintAgent(): Promise<boolean> {
  return (await getPrinterStatus()) === "ready";
}

export async function printBadge(
  design: BadgeDesign,
  attendee: AttendeeForBadge,
): Promise<PrintResult> {
  try {
    const pdf = await generateBadgePdf(design, [attendee]);
    const res = await fetch(`${AGENT_URL}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      signal: AbortSignal.timeout(10000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      jobId?: string;
      error?: string;
    };
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.error ?? `Agent gaf HTTP ${res.status}` };
    }
    return { ok: true, jobId: body.jobId ?? "?" };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.name === "TimeoutError"
          ? "Printerkoppeling reageert niet"
          : "Printerkoppeling niet bereikbaar",
    };
  }
}
