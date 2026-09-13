import type { Metadata } from "next";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = {
  title: "Welkom",
  robots: { index: false },
};

export default function WelcomePage() {
  return (
    <div className="max-w-md mx-auto">
      <WelcomeForm />
    </div>
  );
}
