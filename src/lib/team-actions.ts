"use server";

import { revalidatePath } from "next/cache";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

type ActionResult = { ok: true } | { ok: false; error: string };

// Sends the join magic-link via an IMPLICIT-flow client, server-side. The
// implicit flow puts the tokens in the URL fragment (#access_token=...),
// which the /join page consumes client-side. Sending from the browser
// (PKCE) would return ?code= instead, which /join cannot exchange — that's
// the classic infinite "sign-in link" loop.
async function sendJoinEmail(email: string, token: string) {
  const mailer = createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  const { error } = await mailer.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/join?token=${token}`,
      shouldCreateUser: true,
    },
  });
  if (error) throw new Error(error.message);
}

// The caller's organization where they are owner (invites are owner-only).
async function ownedOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export async function inviteColleague(email: string): Promise<ActionResult> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: "Vul een geldig e-mailadres in." };
  }
  const orgId = await ownedOrgId();
  if (!orgId) {
    return { ok: false, error: "Alleen de eigenaar kan collega's uitnodigen." };
  }
  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("organization_invites")
    .insert({ organization_id: orgId, invited_email: clean })
    .select("token")
    .single();
  if (error) return { ok: false, error: error.message };
  try {
    await sendJoinEmail(clean, invite.token);
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && /rate/i.test(e.message)
          ? "Mail-limiet bereikt — probeer het over een uur opnieuw."
          : `Uitnodiging aangemaakt, maar mail versturen mislukte: ${e instanceof Error ? e.message : e}`,
    };
  }
  revalidatePath("/team");
  return { ok: true };
}

export async function resendInvite(inviteId: string): Promise<ActionResult> {
  const supabase = await createClient();
  // RLS: only the org owner can see/update this row.
  const { data: invite, error } = await supabase
    .from("organization_invites")
    .update({
      is_active: true,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    })
    .eq("id", inviteId)
    .select("invited_email, token")
    .single();
  if (error || !invite) {
    return { ok: false, error: error?.message ?? "Uitnodiging niet gevonden." };
  }
  try {
    await sendJoinEmail(invite.invited_email, invite.token);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Mail versturen mislukte.",
    };
  }
  revalidatePath("/team");
  return { ok: true };
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_invites")
    .update({ is_active: false })
    .eq("id", inviteId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

// Recovery for an expired/used link, callable WITHOUT a session (rule 6 of
// the invite playbook: never dead-end). Possession of the old token is the
// capability; the service role looks it up and issues a fresh invite.
export async function resendJoinLink(token: string): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/.test(token)) {
    return { ok: false, error: "Ongeldige uitnodigingslink." };
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { ok: false, error: "Server is niet geconfigureerd voor invites." };
  }
  const admin = createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: old } = await admin
    .from("organization_invites")
    .select("organization_id, invited_email")
    .eq("token", token)
    .maybeSingle();
  if (!old) return { ok: false, error: "Deze uitnodiging bestaat niet." };
  const { data: fresh, error } = await admin
    .from("organization_invites")
    .insert({
      organization_id: old.organization_id,
      invited_email: old.invited_email,
    })
    .select("token")
    .single();
  if (error) return { ok: false, error: error.message };
  try {
    await sendJoinEmail(old.invited_email, fresh.token);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Mail versturen mislukte.",
    };
  }
  return { ok: true };
}
