import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export async function MarketingNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <ScanLine className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Badge Scan</span>
        </Link>
        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <Link href="/events" className={buttonVariants()}>
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost" })}
              >
                Sign in
              </Link>
              <Link href="/login" className={buttonVariants()}>
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
