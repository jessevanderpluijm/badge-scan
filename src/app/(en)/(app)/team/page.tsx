import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import {
  InviteForm,
  InviteRowActions,
  MemberRowActions,
} from "./team-controls";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false },
};

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ensure the org exists (first visit) and scope everything to it.
  const { data: orgId } = await supabase.rpc("create_own_organization");

  const [{ data: org }, { data: allMemberships }, { data: members }, { data: invites }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", orgId).single(),
    // Every org this user belongs to — a user can also be a member of
    // someone else's organization via an invite.
    supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user!.id),
    supabase
      .from("organization_members")
      .select("id, member_email, role, user_id, created_at")
      .eq("organization_id", orgId)
      .order("created_at"),
    // RLS: only owners see invites; members get an empty list.
    supabase
      .from("organization_invites")
      .select("id, invited_email, is_active, expires_at, created_at")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const me = members?.find((m) => m.user_id === user?.id);
  const isOwner = me?.role === "owner";
  const otherOrgs = (allMemberships ?? []).filter(
    (m) => m.organization_id !== orgId,
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Team van {org?.name ?? "je organisatie"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Iedereen in deze organisatie ziet dezelfde events en kan scannen en
          badges printen.
        </p>
      </div>

      {isOwner && (
        <Card className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold">Collega uitnodigen</h2>
            <p className="text-xs text-muted-foreground">
              Je collega krijgt een e-mail met een link, kiest een wachtwoord
              en kan meteen aan de slag.
            </p>
          </div>
          <InviteForm />
        </Card>
      )}

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Leden</h2>
        <ul className="divide-y">
          {(members ?? []).map((m) => (
            <li
              key={m.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm truncate">
                  {m.member_email ?? "—"}
                  {m.user_id === user?.id && (
                    <span className="text-muted-foreground"> (jij)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.role === "owner" ? "Eigenaar" : "Lid"}
                </p>
              </div>
              {isOwner && m.user_id !== user?.id && (
                <MemberRowActions memberId={m.id} email={m.member_email} />
              )}
            </li>
          ))}
        </ul>
      </Card>

      {otherOrgs.length > 0 && (
        <Card className="p-5 space-y-2">
          <h2 className="font-semibold">Ook lid van</h2>
          <p className="text-xs text-muted-foreground">
            Je bent via een uitnodiging ook lid van deze organisatie(s) — hun
            events staan gewoon tussen jouw eventlijst.
          </p>
          <ul className="text-sm space-y-1">
            {otherOrgs.map((m) => (
              <li key={m.organization_id}>
                {(m.organizations as unknown as { name: string } | null)
                  ?.name ?? "Onbekende organisatie"}{" "}
                <span className="text-muted-foreground">
                  ({m.role === "owner" ? "eigenaar" : "lid"})
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isOwner && (invites?.length ?? 0) > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Openstaande uitnodigingen</h2>
          <ul className="divide-y">
            {invites!.map((inv) => (
              <li
                key={inv.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">{inv.invited_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.expires_at) < new Date()
                      ? "Verlopen"
                      : `Geldig t/m ${new Date(inv.expires_at).toLocaleDateString("nl-NL")}`}
                  </p>
                </div>
                <InviteRowActions inviteId={inv.id} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
