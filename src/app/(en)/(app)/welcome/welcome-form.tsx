"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// First-login step for invited colleagues: they arrived via magic link and
// have no password yet. Sets the password AND our own password_set flag —
// Supabase's password column always holds a placeholder hash, so the flag
// is the only reliable signal.
export function WelcomeForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Gebruik minimaal 8 tekens.");
      return;
    }
    if (password !== confirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    setSaving(false);
    if (error) return setError(error.message);
    router.replace("/events");
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Welkom!
        </h1>
        <p className="text-sm text-muted-foreground">
          Je account is klaar. Kies een wachtwoord waarmee je voortaan kunt
          inloggen.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pw">Wachtwoord</Label>
          <Input
            id="pw"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw2">Herhaal wachtwoord</Label>
          <Input
            id="pw2"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}
        <Button type="submit" disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Opslaan…" : "Opslaan en beginnen"}
        </Button>
      </form>
    </Card>
  );
}
