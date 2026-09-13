"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, MailPlus, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  inviteColleague,
  removeMember,
  resendInvite,
  revokeInvite,
} from "@/lib/team-actions";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await inviteColleague(email);
      if (result.ok) {
        setEmail("");
        setIsError(false);
        setMessage("Uitnodiging verstuurd — je collega heeft mail.");
      } else {
        setIsError(true);
        setMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="collega@bedrijf.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MailPlus className="h-4 w-4" />
          )}
          Uitnodigen
        </Button>
      </div>
      {message && (
        <p
          className={
            isError
              ? "text-sm text-destructive flex items-center gap-1.5"
              : "text-sm text-success"
          }
        >
          {isError && <AlertCircle className="h-4 w-4" />} {message}
        </p>
      )}
    </form>
  );
}

export function InviteRowActions({ inviteId }: { inviteId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Er ging iets mis.");
    });

  return (
    <div className="flex items-center gap-1">
      {error && <p className="text-xs text-destructive mr-1">{error}</p>}
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => resendInvite(inviteId))}
        title="Opnieuw versturen"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => run(() => revokeInvite(inviteId))}
        title="Intrekken"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function MemberRowActions({
  memberId,
  email,
}: {
  memberId: string;
  email: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `${email ?? "Dit lid"} uit het team verwijderen? Diegene verliest direct toegang tot alle events.`,
          )
        )
          return;
        startTransition(async () => {
          await removeMember(memberId);
        });
      }}
      title="Verwijderen"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
