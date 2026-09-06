#!/usr/bin/env node
// PrintBadges print agent
// ----------------------
// Tiny local bridge between the PrintBadges portal (in the browser) and the
// Epson ColorWorks C4000e connected to this machine. The portal generates the
// badge PDF client-side and POSTs it here; we hand it to CUPS via `lp`.
//
// Run on the check-in laptop:
//   npm run print-agent
// or standalone:
//   node scripts/print-agent.mjs
//
// Configuration via env vars (defaults match Jesse's reference setup):
//   PRINTER  CUPS queue name        (default: EPSON_CW_C4000e)
//   MEDIA    CUPS media size        (default: Custom.104x269mm — one full
//            2-label badge incl. side bleed; one page per badge)
//   PORT     port to listen on      (default: 9123)
//
// Endpoints:
//   GET  /health -> { ok, printer }              (used by the portal to show status)
//   POST /print  -> { ok, jobId } | { error }    (body: application/pdf bytes)
//
// The agent binds to 127.0.0.1 only: nothing outside this machine can reach
// it. Browsers allow HTTPS pages to call http://localhost, so the hosted
// portal can talk to it without certificate juggling.

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PRINTER = process.env.PRINTER ?? "EPSON_CW_C4000e";
const MEDIA = process.env.MEDIA ?? "Custom.104x269mm";
const PORT = Number(process.env.PORT ?? 9123);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}
const lp = (args) => run("lp", args);

// ── Physical printer health ──────────────────────────────────────────
// Two independent signals, because the C4000e keeps its USB port alive
// in soft-off on some firmwares:
//  1. USB enumeration: hard-off / unplugged devices vanish from ioreg.
//  2. Queue movement: jobs that sit unclaimed mean the printer isn't
//     consuming (soft-off, cover open, error state).
const USB_MATCH = process.env.USB_MATCH ?? "CW-C4000";
let stuckSince = null; // timestamp of first sighting of a non-moving queue head
let lastJobHead = null;

async function usbPresent() {
  try {
    const out = await run("ioreg", ["-p", "IOUSB", "-w0"]);
    return out.includes(USB_MATCH);
  } catch {
    return true; // ioreg failure shouldn't take the printer "down"
  }
}

async function queueStuck() {
  try {
    const out = await run("lpstat", ["-o", PRINTER]).catch(() => "");
    const head = out.split("\n")[0]?.split(/\s+/)[0] || null;
    if (!head) {
      lastJobHead = null;
      stuckSince = null;
      return false;
    }
    if (head !== lastJobHead) {
      lastJobHead = head;
      stuckSince = Date.now();
      return false;
    }
    return Date.now() - (stuckSince ?? Date.now()) > 20000;
  } catch {
    return false;
  }
}

async function printerReady() {
  if (!(await usbPresent())) {
    return { ready: false, reason: "Printer niet gevonden op USB — staat hij aan en zit de kabel erin?" };
  }
  if (await queueStuck()) {
    return { ready: false, reason: "De printer neemt geen opdrachten aan — staat hij aan? (wachtrij loopt vast)" };
  }
  return { ready: true, reason: null };
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/health") {
    const status = await printerReady();
    res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        ok: true,
        printer: PRINTER,
        printerOnline: status.ready,
        reason: status.reason,
      }),
    );
  }

  if (req.method === "POST" && req.url === "/print") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const pdf = Buffer.concat(chunks);

    if (pdf.length < 100 || !pdf.subarray(0, 5).toString().startsWith("%PDF")) {
      res.writeHead(400, { ...CORS, "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Body is not a PDF" }));
    }

    const status = await printerReady();
    if (!status.ready) {
      res.writeHead(503, { ...CORS, "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: status.reason }));
    }

    const file = join(tmpdir(), `badge-${Date.now()}.pdf`);
    try {
      await writeFile(file, pdf);
      const out = await lp([
        "-d", PRINTER,
        "-o", `media=${MEDIA}`,
        "-o", "fit-to-page=false",
        file,
      ]);
      const jobId = /request id is (\S+)/.exec(out)?.[1] ?? out;
      console.log(`[print] ${jobId} (${pdf.length} bytes)`);
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, jobId }));
    } catch (e) {
      console.error("[print] failed:", e.message);
      res.writeHead(502, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    } finally {
      unlink(file).catch(() => {});
    }
    return;
  }

  res.writeHead(404, CORS);
  res.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`PrintBadges print agent`);
  console.log(`  printer : ${PRINTER}`);
  console.log(`  media   : ${MEDIA}`);
  console.log(`  luistert: http://127.0.0.1:${PORT}`);
  console.log(`Laat dit venster open tijdens het event. Stoppen: Ctrl+C.`);
});
