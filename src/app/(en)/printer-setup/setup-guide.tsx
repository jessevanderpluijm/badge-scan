"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Copy,
  Download,
  Loader2,
  Printer,
  RotateCcw,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_DESIGN } from "@/lib/badge";
import {
  browserBlocksLocalAgent,
  getPrinterStatus,
  printBadge,
} from "@/lib/print-agent";

const STORAGE_KEY = "badgescan-setup-progress";

type StepDef = {
  id: string;
  title: string;
  body: React.ReactNode;
  task?: string; // tussentijdse opdracht om de stap te verifiëren
  auto?: "printer"; // stap wordt automatisch afgevinkt via live detectie
};

const STEPS: StepDef[] = [
  {
    id: "media",
    title: "Printer opstarten",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Sluit de printer aan op het stroom.</li>
        <li>Zet de printer aan.</li>
        <li>Voeg de badges toe via de achterkant.</li>
      </ul>
    ),
    task:
      "Opdracht: druk 1× op de ⤓-knop (Feed). Komt er precies één badge-label uit en stopt de printer dan netjes? Dan is de rol goed geladen.",
  },
  {
    id: "software",
    title: "Installeer software",
    body: (
      <p>
        Installeer de Epson-driver via{" "}
        <a
          href="https://support.epson.net/setupnavi/?PINF=swlist&OSC=MI&LG2=EN&MKN=CW-C4000e"
          target="_blank"
          rel="noreferrer"
          className="underline hover:no-underline"
        >
          Epson Setup Navi
        </a>{" "}
        (kies macOS → Printer Driver) en doorloop het installatieprogramma.
      </p>
    ),
  },
  {
    id: "connect",
    title: "Verbind printer",
    body: (
      <p>
        Sluit de USB-kabel aan tussen de printer en de laptop. Voeg daarna de
        printer toe via Systeeminstellingen → Printers en scanners; bij
        “Use:” hoort automatisch <em>EPSON CW-C4000e</em> te staan.
      </p>
    ),
  },
  {
    id: "app",
    title: "Download de PrintBadges-app",
    body: (
      <>
        <p>
          De PrintBadges-app is het check-in-station voor de eventdag: de
          portal en het printen in één venster, zonder browser.
        </p>
        <p>
          <a
            href="/downloads/PrintBadges.pkg"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Download PrintBadges voor Mac
          </a>
        </p>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>
            Open het gedownloade bestand en doorloop de installatie (je Mac
            vraagt één keer om je wachtwoord).
          </li>
          <li>
            De app opent daarna vanzelf en staat voortaan in je map
            Programma&apos;s. Log in met je PrintBadges-account.
          </li>
        </ol>
      </>
    ),
    task: "Check: opent de app en zie je de portal?",
  },
  {
    id: "printer-online",
    title: "Printer verbonden",
    auto: "printer",
    body: (
      <p>
        Open deze handleiding ook eens ín de app (klik op
        &ldquo;handleiding&rdquo; bij de printerstatus): zodra de app de
        printer ziet — aan, USB-kabel erin — kleurt deze stap vanzelf
        groen.
      </p>
    ),
    task: "Deze pagina checkt de printerverbinding automatisch.",
  },
];

// A browser can't run a shell script on the Mac, so the closest thing to a
// one-click install is: copy the one-liner, paste it in Terminal. The
// command points at this same origin, so it also works on preview deploys
// and localhost.
function InstallCommand() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const command = `curl -fsSL ${origin ?? "https://print-badges.com"}/print-agent/install.sh | bash`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      // Clipboard API refused (older browser, embedded webview, permission
      // denied): select the command so a plain ⌘+C still works.
      const el = codeRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setState("manual");
    }
    setTimeout(() => setState("idle"), 3000);
  }

  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <Button type="button" size="sm" onClick={copy} className="w-full sm:w-auto">
        {state === "copied" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {state === "copied" ? "Gekopieerd!" : "Kopieer installatiecommando"}
      </Button>
      {state === "manual" && (
        <p className="text-xs text-foreground">
          Kopiëren lukte niet automatisch — het commando is geselecteerd, druk
          op ⌘ + C.
        </p>
      )}
      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
        <li>
          Open <strong>Terminal</strong> (⌘ + spatie, typ “Terminal”, Enter).
        </li>
        <li>Plak het commando (⌘ + V) en druk op Enter.</li>
        <li>
          Wacht op het groene vinkje in Terminal; deze stap kleurt dan vanzelf
          groen.
        </li>
      </ol>
      <code
        ref={codeRef}
        className="block text-[11px] break-all text-muted-foreground select-all"
      >
        {command}
      </code>
    </div>
  );
}

export function SetupGuide() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [agentUp, setAgentUp] = useState(false);
  const [printerUp, setPrinterUp] = useState(false);
  const [safari, setSafari] = useState(false);
  const [testState, setTestState] = useState<
    "idle" | "printing" | "done" | "error"
  >("idle");
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDone(JSON.parse(saved));
    } catch {}
    setSafari(browserBlocksLocalAgent());
    let active = true;
    const ping = async () => {
      const status = await getPrinterStatus();
      if (!active) return;
      setAgentUp(status !== "no-agent");
      setPrinterUp(status === "ready");
    };
    ping();
    const timer = setInterval(ping, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  function resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setDone({});
    setTestState("idle");
    setTestError(null);
  }

  function toggle(id: string) {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function isChecked(step: StepDef): boolean {
    if (step.auto === "printer") return printerUp;
    return !!done[step.id];
  }

  async function printTestBadge() {
    setTestState("printing");
    setTestError(null);
    const result = await printBadge(DEFAULT_DESIGN, {
      first_name: "Test",
      last_name: "Geslaagd",
      email: null,
      company: "PrintBadges",
      job_title: "Printer werkt! 🎉",
      barcode: "SETUP-TEST",
    });
    if (result.ok) {
      setTestState("done");
    } else {
      setTestState("error");
      setTestError(result.error);
    }
  }

  const completed = STEPS.filter(isChecked).length;
  const allDone = completed === STEPS.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-success transition-all duration-500"
            style={{ width: `${(completed / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completed} van {STEPS.length}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetProgress}
          title="Begin opnieuw"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Opnieuw
        </Button>
      </div>

      {safari && !agentUp && (
        <Card className="p-5 border-warning/70 bg-warning/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-warning" />
            <div className="min-w-0 space-y-2">
              <h2 className="font-semibold leading-tight">
                Goed om te weten: printen werkt niet vanuit Safari
              </h2>
              <p className="text-sm text-muted-foreground">
                Deze handleiding lezen kan hier prima, maar op de eventdag
                gebruik je de <strong>PrintBadges-app</strong> (stap 4) —
                daarin werkt alles, printen incluis.
              </p>
            </div>
          </div>
        </Card>
      )}

      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const checked = isChecked(step);
          return (
            <li key={step.id}>
              <Card
                className={cn(
                  "p-5 transition-colors",
                  checked && "border-success/50 bg-success/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => !step.auto && toggle(step.id)}
                    disabled={!!step.auto}
                    className={cn(
                      "mt-0.5 flex-shrink-0",
                      step.auto ? "cursor-default" : "cursor-pointer",
                    )}
                    aria-label={
                      checked ? "Stap afgerond" : "Markeer stap als afgerond"
                    }
                  >
                    {checked ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : step.auto ? (
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                  <div className="min-w-0 space-y-2">
                    <h2 className="font-semibold leading-tight">
                      {i + 1}. {step.title}
                    </h2>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {step.body}
                    </div>
                    {step.task && (
                      <p
                        className={cn(
                          "text-sm rounded-md px-3 py-2 border",
                          checked
                            ? "border-success/40 bg-success/10"
                            : "bg-muted/40",
                        )}
                      >
                        {step.task}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <Card
        className={cn(
          "p-6 text-center space-y-3",
          allDone && "border-success/50",
        )}
      >
        <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          {testState === "done" ? (
            <Sparkles className="h-5 w-5 text-success" />
          ) : (
            <Printer className="h-5 w-5 text-primary" />
          )}
        </div>
        <h2 className="font-semibold">Eindopdracht: print een testbadge</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Rolt er een badge uit met “Test Geslaagd” erop — op beide helften,
          netjes afgeknipt? Dan is de printer klaar voor het echte werk.
        </p>
        {testError && <p className="text-sm text-destructive">{testError}</p>}
        {testState === "done" && (
          <p className="text-sm text-success font-medium">
            Testbadge verstuurd — check de printer! 🎉
          </p>
        )}
        <Button
          onClick={printTestBadge}
          disabled={!printerUp || testState === "printing"}
        >
          {testState === "printing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanLine className="h-4 w-4" />
          )}
          {testState === "printing"
            ? "Printen…"
            : testState === "done"
              ? "Print nog een testbadge"
              : "Print testbadge"}
        </Button>
        {!printerUp && (
          <p className="text-xs text-muted-foreground">
            Beschikbaar zodra stap 5 groen is — open deze pagina in de
            PrintBadges-app.
          </p>
        )}
      </Card>

      <Reference />
    </div>
  );
}

// One collapsible documentation topic (native <details> — no state needed).
function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <details className="group">
        <summary className="flex items-center justify-between gap-3 cursor-pointer select-none p-5 font-semibold list-none [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-5 pb-5 space-y-3">{children}</div>
      </details>
    </Card>
  );
}

// Static documentation under the interactive guide: supplier details,
// event-day routine and the complete panel settings list.
function Reference() {
  const ext = (href: string, label: string) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline hover:no-underline"
    >
      {label}
    </a>
  );

  return (
    <div className="space-y-4 pt-4">
      <h2 className="text-lg font-semibold tracking-tight">Documentatie</h2>

      <DocSection title="Hardware">
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>
            Leverancier: {ext("https://www.businesslabels.nl/", "businesslabels.nl")}
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>Accountmanager: Egbert van Ark</li>
              <li>
                E-mail:{" "}
                <a
                  href="mailto:egbert@smart2b.nl"
                  className="underline hover:no-underline"
                >
                  egbert@smart2b.nl
                </a>
              </li>
              <li>Telefoon: +31 (0)318 590 212</li>
            </ul>
          </li>
          <li>
            Printer:{" "}
            {ext(
              "https://businesslabels.nl/product/colorworks-cw-c4000-mk/",
              "Epson ColorWorks C4000e",
            )}
          </li>
          <li>
            Labels:{" "}
            {ext(
              "https://businesslabels.nl/product/expobadge-25350920-260t",
              "ExpoBadge 260T",
            )}{" "}
            — 96 × 134 mm per label
          </li>
        </ul>
      </DocSection>

      <DocSection title="Op de eventdag">
        <div className="text-sm text-muted-foreground space-y-3">
          <div>
            <p className="font-medium text-foreground mb-1">Opstarten</p>
            <ol className="list-decimal pl-5 space-y-0.5">
              <li>Sluit de printer aan op stroom.</li>
              <li>Zet de printer aan.</li>
              <li>Verbind de printer via USB met de laptop.</li>
              <li>Voer de badges in via de achterkant.</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Afsluiten</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Open de printer aan de voorkant via de grijze hendel.</li>
              <li>Haal daarna de badges uit de printer.</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection title="Printerinstellingen (volledig)">
        <p className="text-sm rounded-md px-3 py-2 bg-muted/40">
          💡 Standaard staan de instellingen goed. Gaat er iets mis,
          controleer dan deze lijst.
        </p>
        <div className="text-sm text-muted-foreground space-y-3">
          <div>
            <p className="font-medium text-foreground mb-1">
              Menu → Media Settings
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Media Type = Synthetic</li>
              <li>Media Form = Die-cut Label</li>
              <li>Media Detect = Gap</li>
              <li>Media Source = Rear Feed</li>
              <li>Media Shape = Fanfold</li>
              <li>Media Layout = 96 width, 134 length</li>
              <li>
                Print Position Adjustment = 3.1 mm Top Position, 0.7 mm Left
                Position
              </li>
              <li>Media Size Notice = Off</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">
              Menu → Print Settings
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Media Type = Synthetic</li>
              <li>Color Adjustment Mode = Epson Vivid Color</li>
              <li>Quality = Normal</li>
              <li>Resolution = 600 dpi</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">
              Menu → General Settings → Printer Settings → Print Options
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Print Mode = Cut</li>
              <li>Cut Position = 0</li>
              <li>Reprint = Enable</li>
              <li>Media Hold Pressure = Auto</li>
              <li>Cancel Action = Job Only</li>
              <li>Actions when replacing Media = Feed without Cut</li>
              <li>Actions on Power On = Not Feed</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection title="Zonder app: losse printerkoppeling (Chrome)">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Wil je de portal liever in Chrome gebruiken in plaats van de
            PrintBadges-app? Installeer dan de losse printerkoppeling: een
            klein achtergrondprogramma dat automatisch meestart met de Mac.
          </p>
          <InstallCommand />
          <p className="text-xs">
            Alternatief zonder installatie: dubbelklik{" "}
            <strong>Badge Printer.command</strong> uit de projectmap en laat
            het venster open staan. Let op: in Safari werkt printen nooit —
            dat is een beperking van Safari zelf.
          </p>
        </div>
      </DocSection>

      <DocSection title="Inktcartridge vervangen">
        <p className="text-sm text-muted-foreground">
          De printer toont zelf de instructies: <strong>Menu</strong> →{" "}
          <strong>Maintenance</strong> →{" "}
          <strong>Ink Cartridge Replacement</strong>.
        </p>
      </DocSection>
    </div>
  );
}
