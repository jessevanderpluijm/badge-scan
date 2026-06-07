"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Single server-side entry point for a /demo form submission. Does two
// things atomically from the caller's point of view: stores the row in
// the demo_requests table (using the Supabase service-role key so RLS
// can't get in the way) and emails the team via Resend.
//
// Env vars (all in Vercel project settings):
//   - NEXT_PUBLIC_SUPABASE_URL          (already there)
//   - SUPABASE_SERVICE_ROLE_KEY         server-only; bypasses RLS for inserts
//   - RESEND_API_KEY                    notification email provider
//   - DEMO_NOTIFICATION_EMAIL           where the notification lands
//   - DEMO_NOTIFICATION_FROM            optional, defaults to onboarding@resend.dev

export type DemoRequestInput = {
  name: string;
  email: string;
  company: string;
  expectedAttendees: string;
  message: string;
};

export type DemoRequestResult =
  | { ok: true }
  | { ok: false; error: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmail(row: {
  name: string;
  email: string;
  company: string | null;
  expected_attendees: number | null;
  message: string | null;
  created_at: string;
}): { subject: string; html: string; text: string } {
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

export async function submitDemoRequest(
  input: DemoRequestInput,
): Promise<DemoRequestResult> {
  // Trim + basic validation. The form does this client-side too but
  // server actions are a public surface, so re-check here.
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name || !email) {
    return { ok: false, error: "Please fill in both your name and email." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "That email address doesn't look right." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Demo request: Supabase env vars missing.");
    return { ok: false, error: "Server is misconfigured. Try again later." };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const expectedAttendees = input.expectedAttendees.trim()
    ? Number(input.expectedAttendees)
    : null;

  const { data: row, error: insertError } = await supabase
    .from("demo_requests")
    .insert({
      name,
      email,
      company: input.company.trim() || null,
      expected_attendees:
        expectedAttendees != null && Number.isFinite(expectedAttendees)
          ? expectedAttendees
          : null,
      message: input.message.trim() || null,
    })
    .select("name, email, company, expected_attendees, message, created_at")
    .single();

  if (insertError || !row) {
    console.error("Demo request insert failed:", insertError);
    return {
      ok: false,
      error:
        "We couldn't save your request right now. Please try again or email us directly.",
    };
  }

  // Lead is recorded. Try to notify; if Resend stumbles we still return
  // ok so the visitor sees the confirmation. The row is the source of
  // truth, the email is just a heads-up.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEMO_NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    console.warn(
      "Demo request stored, but RESEND_API_KEY / DEMO_NOTIFICATION_EMAIL missing — no email sent.",
    );
    return { ok: true };
  }
  const from =
    process.env.DEMO_NOTIFICATION_FROM ?? "Badge Scan <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { subject, html, text } = renderEmail(row);
    const { error: sendError } = await resend.emails.send({
      from,
      to,
      replyTo: row.email,
      subject,
      html,
      text,
    });
    if (sendError) {
      console.error(
        "Demo request stored but Resend send failed:",
        sendError,
      );
    }
  } catch (e) {
    console.error("Demo request stored but Resend threw:", e);
  }

  return { ok: true };
}
