"use client";

// Client for the local PrintBadges print agent (scripts/print-agent.mjs).
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

// ── PrintBadges desktop app bridge ──────────────────────────────────
// Inside the native macOS app the portal runs in a WKWebView, which blocks
// localhost fetches exactly like Safari does. The app instead exposes a
// native message handler; requests go out via postMessage and answers come
// back through window.__printbadgesCallback. When the bridge exists it is
// always preferred over the HTTP agent.
type BridgeResponse = {
  ok?: boolean;
  printerOnline?: boolean;
  jobId?: string;
  error?: string;
  reason?: string | null;
};

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        printbadges?: { postMessage: (msg: unknown) => void };
      };
    };
    __printbadgesCallback?: (id: string, result: BridgeResponse) => void;
  }
}

function appBridge() {
  if (typeof window === "undefined") return null;
  return window.webkit?.messageHandlers?.printbadges ?? null;
}

export function runsInDesktopApp(): boolean {
  return appBridge() !== null;
}

const pendingBridgeCalls = new Map<string, (r: BridgeResponse) => void>();

function bridgeCall(
  message: Record<string, unknown>,
  timeoutMs: number,
): Promise<BridgeResponse> {
  const bridge = appBridge();
  if (!bridge) return Promise.resolve({ ok: false, error: "geen app-brug" });
  if (!window.__printbadgesCallback) {
    window.__printbadgesCallback = (id, result) => {
      const resolve = pendingBridgeCalls.get(id);
      if (resolve) {
        pendingBridgeCalls.delete(id);
        resolve(result ?? {});
      }
    };
  }
  return new Promise<BridgeResponse>((resolve) => {
    const id = Math.random().toString(36).slice(2);
    pendingBridgeCalls.set(id, resolve);
    setTimeout(() => {
      if (pendingBridgeCalls.delete(id)) {
        resolve({ ok: false, error: "App reageert niet" });
      }
    }, timeoutMs);
    bridge.postMessage({ id, ...message });
  });
}

// Safari refuses http://127.0.0.1 calls from an https page as mixed content,
// so the agent is invisible there no matter what. Chrome and Firefox treat
// loopback as trustworthy. Detect it so the UI can say "open this in Chrome"
// instead of spinning forever. Inside the desktop app the bridge makes the
// question moot.
export function browserBlocksLocalAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  if (runsInDesktopApp()) return false;
  const ua = navigator.userAgent;
  return (
    navigator.vendor === "Apple Computer, Inc." &&
    /Safari/.test(ua) &&
    !/Chrome|CriOS|Chromium|Edg|FxiOS/.test(ua)
  );
}

export type PrintResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

// "ready"       → agent draait én de fysieke printer is bereikbaar
// "printer-off" → agent draait, maar de printer staat uit / kabel los / vastgelopen
// "no-agent"    → geen printerkoppeling op deze laptop
export type PrinterStatus = "ready" | "printer-off" | "no-agent";

export async function getPrinterStatus(): Promise<PrinterStatus> {
  if (runsInDesktopApp()) {
    const body = await bridgeCall({ type: "health" }, 3000);
    if (!body.ok) return "no-agent";
    return body.printerOnline === false ? "printer-off" : "ready";
  }
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
    if (runsInDesktopApp()) {
      let binary = "";
      for (let i = 0; i < pdf.length; i += 0x8000) {
        binary += String.fromCharCode(
          ...pdf.subarray(i, Math.min(i + 0x8000, pdf.length)),
        );
      }
      const body = await bridgeCall(
        { type: "print", pdf: btoa(binary) },
        15000,
      );
      if (!body.ok) {
        return { ok: false, error: body.error ?? "Printen mislukte in de app" };
      }
      return { ok: true, jobId: body.jobId ?? "?" };
    }
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
