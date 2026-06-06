import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function FinalCta({
  heading = "Skip the badge-printing headache.",
  body = "Set up your first event in under a minute. Free while you try it.",
}: {
  heading?: string;
  body?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;

  return (
    <section className="container pb-20">
      <div className="rounded-2xl border bg-primary text-primary-foreground p-10 sm:p-14 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {heading}
        </h2>
        <p className="text-primary-foreground/70 mt-3 max-w-xl mx-auto">
          {body}
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href={loggedIn ? "/events" : "/login"}
            className={cn(
              buttonVariants({ size: "lg", variant: "secondary" }),
              "font-semibold",
            )}
          >
            {loggedIn ? "Open dashboard" : "Get started free"}{" "}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
