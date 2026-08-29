"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Printer,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_DESIGN } from "@/lib/badge";
import { getPrinterStatus, printBadge } from "@/lib/print-agent";

const STORAGE_KEY = "badgescan-setup-progress";

type StepDef = {
  id: string;
  title: string;
  body: React.ReactNode;
  task?: string; // tussentijdse opdracht om de stap te verifiëren
  auto?: "agent" | "printer"; // stap wordt automatisch afgevinkt via live detectie
};

const STEPS: StepDef[] = [
  {
    id: "unpack",
    title: "Printer uitpakken en inkt installeren",
    body: (
      <>
        <p>
          Verwijder al het blauwe transporttape — ook binnenin de printer.
          Open de voorklep en klik de inktcartridge erin. Zet de printer aan
          en wacht tot het opladen van de inkt klaar is (±10-15 minuten bij
          de eerste keer; het lampje knippert zolang het bezig is).
        </p>
      </>
    ),
    task:
      "Check: brandt het aan/uit-lampje continu blauw (niet knipperend) en toont het scherm “Gereed”?",
  },
  {
    id: "media",
    title: "Badgerol laden",
    body: (
      <>
        <p>
          De ExpoBadge-badges zijn een gevouwen stapel (fanfold) en gaan via
          de <strong>sleuf aan de achterkant</strong> de printer in — niet op
          de rolhouder. Let op de printzijde: de kant waar je elke badge
          afzonderlijk omlijnd ziet (met ronde hoeken) moet <strong>boven</strong>{" "}
          liggen. Voer de eerste badge in de achtersleuf tot de printer hem
          pakt.
        </p>
      </>
    ),
    task:
      "Opdracht: druk 1× op de ⤓-knop (Feed). Komt er precies één badge-label uit en stopt de printer dan netjes? Dan is de rol goed geladen.",
  },
  {
    id: "panel",
    title: "Printerinstellingen op het paneel",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Media vorm: <strong>gestanst etiket</strong> (die-cut label)
        </li>
        <li>
          Media detectie: <strong>tussenruimte</strong> (gap)
        </li>
        <li>
          Papiertype: <strong>mat papier</strong>
        </li>
        <li>
          Menu → Algemene instellingen → Printerinstellingen →
          Media-instellingen → onderaan: <strong>Melding mediaformaat: Uit</strong>
        </li>
      </ul>
    ),
    task:
      "Check: toont het startscherm van de printer “Mat Papier · Gap” met een breedte rond de 96 mm?",
  },
  {
    id: "driver",
    title: "Printer aansluiten op de laptop",
    body: (
      <>
        <p>
          Sluit de USB-kabel aan. Installeer de Epson-driver via{" "}
          <a
            href="https://support.epson.net/setupnavi/?PINF=swlist&OSC=MI&LG2=EN&MKN=CW-C4000e"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            Epson Setup Navi
          </a>{" "}
          (kies macOS → Printer Driver). Voeg daarna de printer toe via
          Systeeminstellingen → Printers en scanners; bij “Use:” hoort
          automatisch <em>EPSON CW-C4000e</em> te staan.
        </p>
      </>
    ),
    task:
      "Check: staat EPSON CW-C4000e in de printerlijst van je Mac, zonder foutmelding?",
  },
  {
    id: "agent",
    title: "Printerkoppeling starten",
    auto: "agent",
    body: (
      <>
        <p>
          De koppeling verbindt de Badge Scan-portal met de printer. Vraag de
          beheerder om de eenmalige installatie
          (<code className="text-xs">bash scripts/install-print-agent.sh</code>),
          of dubbelklik het bestand <strong>Badge Printer.command</strong> en
          laat het venster open staan.
        </p>
      </>
    ),
    task: "Deze pagina detecteert de koppeling automatisch zodra hij draait.",
  },
  {
    id: "printer-online",
    title: "Printer verbonden",
    auto: "printer",
    body: (
      <p>
        Zodra de koppeling draait én de printer aan staat met de USB-kabel
        erin, kleurt deze stap vanzelf groen.
      </p>
    ),
    task: "Deze pagina checkt de printerverbinding automatisch.",
  },
];

export function SetupGuide() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [agentUp, setAgentUp] = useState(false);
  const [printerUp, setPrinterUp] = useState(false);
  const [testState, setTestState] = useState<
    "idle" | "printing" | "done" | "error"
  >("idle");
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDone(JSON.parse(saved));
    } catch {}
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
    if (step.auto === "agent") return agentUp;
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
      company: "Badge Scan",
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
      </div>

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
            Beschikbaar zodra stap 5 en 6 groen zijn.
          </p>
        )}
      </Card>
    </div>
  );
}
