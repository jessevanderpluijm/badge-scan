"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resendJoinLink } from "@/lib/team-actions";

type State =
  | { kind: "working" }
  | { kind: "no-session" }
  | { kind: "joined" }
  | { kind: "error"; code: "expired" | "invalid" | "mismatch" | "other"; detail?: string };

// Consumes the invite magic-link. The email link carries the session in the
// URL FRAGMENT (implicit flow), so this page needs its own implicit-flow
// browser client — the app-wide PKCE client would ignore #access_token.
export function JoinFlow() {
  const params = useSearchParams();
  const token = params.get("token");
  const ran = useRef(false);
  const [state, setState] = useState<State>({ kind: "working" });
  const [resent, setResent] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { isSingleton: false, auth: { flowType: "implicit" } },
      ),
    [],
  );

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;

    let unsubscribed = false;

    const waitForSession = () =>
      new Promise<boolean>((resolve) => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) return resolve(true);
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
              supabase.auth.getSession().then(({ data: d }) => {
                if (d.session) {
                  subscription.unsubscribe();
                  resolve(true);
                }
              });
            }
          });
          setTimeout(() => {
            if (!unsubscribed) {
              subscription.unsubscribe();
              resolve(false);
            }
          }, 4000);
        });
      });

    (async () => {
      const hasSession = await waitForSession();
      if (!hasSession) {
        setState({ kind: "no-session" });
        return;
      }
      const { error } = await supabase.rpc("join_organization", {
        p_token: token,
      });
      if (error) {
        const msg = error.message ?? "";
        setState({
          kind: "error",
          code: msg.includes("invite_expired")
            ? "expired"
            : msg.includes("invite_invalid")
              ? "invalid"
              : msg.includes("email_mismatch")
                ? "mismatch"
                : "other",
          detail: msg,
        });
        return;
      }
      setState({ kind: "joined" });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // New colleagues arrive via magic link and have no password yet;
      // the flag is ours (Supabase's own password column can't be trusted).
      window.location.href = user?.user_metadata?.password_set
        ? "/events"
        : "/welcome";
    })();

    return () => {
      unsubscribed = true;
    };
  }, [supabase, token]);

  async function onResend() {
    if (!token) return;
    setResending(true);
    const result = await resendJoinLink(token);
    setResending(false);
    setResent(
      result.ok
        ? "Nieuwe link verstuurd — check je e-mail (ook je spam)."
        : result.error,
    );
  }

  if (!token) {
    return (
      <Card className="p-6 space-y-2">
        <p className="font-medium flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" /> Ongeldige link
        </p>
        <p className="text-sm text-muted-foreground">
          Deze uitnodigingslink mist zijn code. Vraag je collega om een nieuwe
          uitnodiging.
        </p>
      </Card>
    );
  }

  if (state.kind === "working") {
    return (
      <Card className="p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm">Uitnodiging controleren…</p>
      </Card>
    );
  }

  if (state.kind === "joined") {
    return (
      <Card className="p-6 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <p className="text-sm">Gelukt! Je wordt doorgestuurd…</p>
      </Card>
    );
  }

  const message =
    state.kind === "no-session"
      ? "Open deze pagina via de link in je uitnodigingsmail — die logt je automatisch in. Is de link verlopen of al gebruikt? Vraag hieronder een nieuwe aan."
      : state.code === "expired"
        ? "Deze uitnodiging is verlopen (links zijn 7 dagen geldig)."
        : state.code === "invalid"
          ? "Deze uitnodiging is al gebruikt of ingetrokken."
          : state.code === "mismatch"
            ? "Je bent ingelogd met een ander e-mailadres dan waar deze uitnodiging voor is. Log uit en open de link opnieuw vanuit de mailbox waar de uitnodiging binnenkwam."
            : `Er ging iets mis: ${state.detail}`;

  return (
    <Card className="p-6 space-y-4">
      <p className="font-medium flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-warning" /> Uitnodiging
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {state.kind !== "error" || state.code !== "mismatch" ? (
        <div className="space-y-2">
          <Button onClick={onResend} disabled={resending}>
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="h-4 w-4" />
            )}
            Stuur mij een nieuwe link
          </Button>
          {resent && <p className="text-sm text-muted-foreground">{resent}</p>}
        </div>
      ) : null}
    </Card>
  );
}
