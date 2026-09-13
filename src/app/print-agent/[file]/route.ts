import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Serves the print-agent installer and the agent itself straight from
// scripts/, so a check-in laptop can self-install without a repo checkout:
//
//   curl -fsSL https://print-badges.com/print-agent/install.sh | bash
//
// The installer downloads /print-agent/print-agent.mjs from the same host.
// Files are read at request time; next.config.ts traces scripts/ into the
// serverless bundle so this works on Vercel too.

const FILES: Record<string, { source: string; type: string }> = {
  "install.sh": {
    source: "install-print-agent.sh",
    type: "text/x-shellscript; charset=utf-8",
  },
  "print-agent.mjs": {
    source: "print-agent.mjs",
    type: "text/javascript; charset=utf-8",
  },
};

const PROD_AGENT_URL = "https://print-badges.com/print-agent/print-agent.mjs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const entry = FILES[file];
  if (!entry) return new NextResponse("Not found", { status: 404 });

  let body = await readFile(
    path.join(process.cwd(), "scripts", entry.source),
    "utf8",
  );

  // The installer defaults to fetching the agent from production. When it
  // is served from a preview deploy or localhost, point it at that same
  // host instead so what you test is what you install.
  if (file === "install.sh") {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto =
      req.headers.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") ? "http" : "https");
    if (host) {
      body = body.replace(
        PROD_AGENT_URL,
        `${proto}://${host}/print-agent/print-agent.mjs`,
      );
    }
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": entry.type,
      // Laptops fetch this once per install; keep it fresh after deploys.
      "Cache-Control": "public, max-age=300",
    },
  });
}
