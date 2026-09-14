"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // The email contains a magic link that drops the user on /login/reset
    // with the recovery token in the URL hash. The reset page picks it up
    // automatically via supabase-js' auth state listener.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset`,
    });

    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Wachtwoord vergeten?</CardTitle>
          <CardDescription>
            We mailen je een link om een nieuw wachtwoord in te stellen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3 text-sm">
              <p>
                Als er een account bestaat voor <strong>{email}</strong>, is
                er een herstel-link onderweg. Check je inbox (en je spam).
              </p>
              <p className="text-muted-foreground">
                De link is een uur geldig.
              </p>
              <Link
                href="/login"
                className="block text-center text-foreground underline hover:no-underline pt-2"
              >
                Terug naar inloggen
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Versturen…" : "Verstuur herstel-link"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Weet je hem weer?{" "}
                <Link
                  href="/login"
                  className="text-foreground underline hover:no-underline"
                >
                  Inloggen
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
