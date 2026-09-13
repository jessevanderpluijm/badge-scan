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
  | {
      kind: "error";
      code: "expired" | "invalid" | "mismatch" | "already" | "otp" | "other";
      detail?: string;
    };

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

    (async () => {
      // Consume the magic-link tokens from the URL fragment OURSELVES:
      // @supabase/ssr hard-forces flowType "pkce" (overriding any option we
      // pass), and a PKCE client silently ignores #access_token fragments —
      // which left invitees stranded on this page without a session.
      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const errorCode = hash.get("error_code");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        if (error) {
          setState({ kind: "error", code: "other", detail: error.message });
          return;
        }
      } else if (errorCode) {
        // Supabase redirected with an error instead of tokens — most often
        // otp_expired: the one-time link was already consumed (mail scanners
        // pre-click links) or is older than an hour.
        setState({
          kind: "error",
          code: errorCode === "otp_expired" ? "otp" : "other",
          detail: hash.get("error_description") ?? errorCode,
        });
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
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
                : msg.includes("already_in_org")
                  ? "already"
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
      : state.code === "otp"
        ? "De inloglink is verlopen of al een keer geopend — soms doet een virusscanner dat ongemerkt vóór jou. Vraag hieronder een nieuwe link aan en open die meteen."
        : state.code === "expired"
          ? "Deze uitnodiging is verlopen (links zijn 7 dagen geldig)."
        : state.code === "invalid"
          ? "Deze uitnodiging is al gebruikt of ingetrokken."
          : state.code === "mismatch"
            ? "Je bent ingelogd met een ander e-mailadres dan waar deze uitnodiging voor is. Log uit en open de link opnieuw vanuit de mailbox waar de uitnodiging binnenkwam."
            : state.code === "already"
              ? "Dit account heeft al een eigen organisatie met events. Een account kan maar bij één organisatie horen — gebruik een ander e-mailadres, of laat de eigenaar van je huidige organisatie je eerst verwijderen."
              : `Er ging iets mis: ${state.detail}`;

  return (
    <Card className="p-6 space-y-4">
      <p className="font-medium flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-warning" /> Uitnodiging
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {state.kind !== "error" ||
      (state.code !== "mismatch" && state.code !== "already") ? (
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
