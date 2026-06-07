import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

// Receives a Supabase Database Webhook on INSERT into demo_requests and
// emails the team. Webhook config:
//   - URL: https://<your-domain>/api/demo-notification
//   - Method: POST
//   - HTTP Header: Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>
//   - Table: public.demo_requests, Events: INSERT
//
// Env vars (set in Vercel project settings → Environment Variables):
//   - SUPABASE_WEBHOOK_SECRET — shared secret, matched against the
//     Authorization header. Keeps strangers from spamming the route.
//   - RESEND_API_KEY — from https://resend.com/api-keys
//   - DEMO_NOTIFICATION_EMAIL — who to notify (e.g. jesse@weticket.com)
//   - DEMO_NOTIFICATION_FROM (optional) — defaults to onboarding@resend.dev;
//     swap for "Badge Scan <demos@yourdomain.com>" once a domain is verified.

export const runtime = "nodejs";

type DemoRequestRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  expected_attendees: number | null;
  message: string | null;
  created_at: string;
};

type SupabaseWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: DemoRequestRow | null;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmail(row: DemoRequestRow): { subject: string; html: string; text: string } {
  const subject = `New demo request: ${row.name}${row.company ? " · " + row.company : ""}`;
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: row.name },
    { label: "Email", value: row.email },
    ...(row.company ? [{ label: "Company", value: row.company }] : []),
    ...(row.expected_attendees != null
      ? [{ label: "Expected attendees", value: String(row.expected_attendees) }]
      : []),
    ...(row.message ? [{ label: "Message", value: row.message }] : []),
    {
      label: "Submitted",
      value: new Date(row.created_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
  ];

  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, system-ui, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h2 style="margin: 0 0 8px; font-size: 18px;">New demo request</h2>
    <p style="margin: 0 0 16px; color: #64748b; font-size: 13px;">Submitted via badge-scan.vercel.app/demo</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      ${rows
        .map(
          (r) => `
        <tr>
          <td style="padding: 8px 0; color: #64748b; vertical-align: top; width: 160px;">${escapeHtml(r.label)}</td>
          <td style="padding: 8px 0; white-space: pre-wrap;">${escapeHtml(r.value)}</td>
        </tr>`,
        )
        .join("")}
    </table>
    <p style="margin: 24px 0 0; color: #64748b; font-size: 12px;">Reply to this email to respond to ${escapeHtml(row.name)}.</p>
  </body>
</html>`;

  const text = rows.map((r) => `${r.label}: ${r.value}`).join("\n");

  return { subject, html, text };
}

export async function POST(req: NextRequest) {
  // 1. Verify the shared secret. Supabase Database Webhooks let you set a
  // custom HTTP header — we configure Authorization: Bearer <secret>.
  const expected = process.env.SUPABASE_WEBHOOK_SECRET;
  const got = req.headers.get("authorization");
  if (!expected) {
    return NextResponse.json(
      { error: "SUPABASE_WEBHOOK_SECRET not configured on the server" },
      { status: 500 },
    );
  }
  if (got !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse the payload.
  let payload: SupabaseWebhookPayload;
  try {
    payload = (await req.json()) as SupabaseWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    payload.type !== "INSERT" ||
    payload.table !== "demo_requests" ||
    !payload.record
  ) {
    // Quietly accept anything else (UPDATE, DELETE) without trying to email.
    return NextResponse.json({ ok: true, ignored: true });
  }
  const row = payload.record;

  // 3. Send the email.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_NOTIFICATION_EMAIL;
  const from = process.env.DEMO_NOTIFICATION_FROM ?? "Badge Scan <onboarding@resend.dev>";
  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "RESEND_API_KEY or DEMO_NOTIFICATION_EMAIL not configured" },
      { status: 500 },
    );
  }
  const resend = new Resend(apiKey);
  const { subject, html, text } = renderEmail(row);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: row.email,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("Resend send failed:", error);
    return NextResponse.json(
      { error: "Failed to send email", detail: error.message ?? null },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
