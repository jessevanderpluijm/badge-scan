#!/usr/bin/env node
// Badge Scan print agent
// ----------------------
// Tiny local bridge between the Badge Scan portal (in the browser) and the
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
//   MEDIA    CUPS media size        (default: Custom.96x271.3mm — one full
//            2-label badge; the portal generates one page per badge)
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
const MEDIA = process.env.MEDIA ?? "Custom.96x271.3mm";
const PORT = Number(process.env.PORT ?? 9123);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function lp(args) {
  return new Promise((resolve, reject) => {
    execFile("lp", args, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, printer: PRINTER }));
  }

  if (req.method === "POST" && req.url === "/print") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const pdf = Buffer.concat(chunks);

    if (pdf.length < 100 || !pdf.subarray(0, 5).toString().startsWith("%PDF")) {
      res.writeHead(400, { ...CORS, "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Body is not a PDF" }));
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
  console.log(`Badge Scan print agent`);
  console.log(`  printer : ${PRINTER}`);
  console.log(`  media   : ${MEDIA}`);
  console.log(`  luistert: http://127.0.0.1:${PORT}`);
  console.log(`Laat dit venster open tijdens het event. Stoppen: Ctrl+C.`);
});
