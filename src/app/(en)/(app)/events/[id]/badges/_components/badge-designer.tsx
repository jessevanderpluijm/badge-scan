"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Loader2,
  Download,
  AlertCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  ALL_FIELDS,
  BADGE_DIMENSIONS_MM,
  BADGE_FONTS,
  BLOCK_LABELS,
  DEFAULT_LAYOUT,
  SIZE_PRESETS,
  type SizePreset,
  FIELD_LABELS,
  generateBadgePdf,
  type AttendeeForBadge,
  type BadgeBlock,
  type BadgeDesign,
  type BadgeField,
  type BadgeFontId,
  type BadgeTextStyle,
  type TextAlign,
} from "@/lib/badge";
import { cn } from "@/lib/utils";
import { BadgePreview } from "./badge-preview";

const MAX_IMAGE_BYTES = 500 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SAMPLE_ATTENDEE: AttendeeForBadge = {
  first_name: "Anna",
  last_name: "Voorbeeld",
  email: "sample@example.com",
  company: "Voorbeeld B.V.",
  job_title: "Productmanager",
  barcode: "1234567890",
};

export function BadgeDesigner({
  eventId,
  eventName,
  initialDesign,
  attendeeCount,
  sampleAttendee,
  mode = "edit",
  onFinish,
}: {
  eventId: string;
  eventName: string;
  initialDesign: BadgeDesign;
  attendeeCount: number;
  sampleAttendee: AttendeeForBadge | null;
  mode?: "edit" | "wizard";
  onFinish?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [design, setDesign] = useState<BadgeDesign>(initialDesign);
  const [selectedBlock, setSelectedBlock] = useState<BadgeBlock | null>(
    "name",
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const previewAttendee = sampleAttendee ?? SAMPLE_ATTENDEE;

  const isDirty = useMemo(
    () => JSON.stringify(design) !== JSON.stringify(initialDesign),
    [design, initialDesign],
  );

  function update<K extends keyof BadgeDesign>(key: K, value: BadgeDesign[K]) {
    setDesign((d) => ({ ...d, [key]: value }));
    setSavedAt(null);
  }

  function updateBlock(block: BadgeBlock, patch: Partial<BadgeTextStyle>) {
    setDesign((d) => ({
      ...d,
      layout: { ...d.layout, [block]: { ...d.layout[block], ...patch } },
    }));
    setSavedAt(null);
  }

  const blockVisible = (b: BadgeBlock) =>
    b === "name"
      ? design.fields.includes("first_name") ||
        design.fields.includes("last_name")
      : design.fields.includes(b);

  function toggleField(f: BadgeField) {
    setDesign((d) => ({
      ...d,
      fields: d.fields.includes(f)
        ? d.fields.filter((x) => x !== f)
        : [...d.fields, f],
    }));
    setSavedAt(null);
  }

  async function onUploadImage(
    file: File,
    target: "logo" | "background_image" | "back_image",
  ) {
    setImageError(null);
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setImageError("Gebruik een PNG-, JPG- of WebP-afbeelding.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(
        `Afbeelding is te groot (${Math.round(file.size / 1024)} KB). Maximaal 500 KB.`,
      );
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    update(target, dataUrl);
  }

  async function onSave() {
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from("events")
      .update({ badge_design: design })
      .eq("id", eventId);
    setSaving(false);
    if (error) return setSaveError(error.message);
    setSavedAt(Date.now());
    router.refresh();
  }

  async function onSaveAndFinish() {
    if (isDirty) {
      setSaving(true);
      setSaveError(null);
      const { error } = await supabase
        .from("events")
        .update({ badge_design: design })
        .eq("id", eventId);
      setSaving(false);
      if (error) return setSaveError(error.message);
    }
    onFinish?.();
  }

  const safeEventName =
    eventName
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "event";

  async function downloadPdf(
    rows: AttendeeForBadge[],
    filename: string,
  ) {
    const pdfBytes = await generateBadgePdf(design, rows);
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function onGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const { data: rows, error } = await supabase
        .from("attendees")
        .select("first_name, last_name, email, company, job_title, barcode")
        .eq("event_id", eventId)
        .order("last_name", { ascending: true });
      if (error) throw error;
      if (!rows || rows.length === 0) {
        throw new Error("Geen deelnemers om te printen. Upload eerst een CSV.");
      }
      await downloadPdf(rows as AttendeeForBadge[], `badges-${safeEventName}.pdf`);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold">1. Huisstijl</h2>
            <p className="text-xs text-muted-foreground">
              Logo, kleuren en eventueel een achtergrond.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-2">
              {design.logo ? (
                <>
                  <img
                    src={design.logo}
                    alt=""
                    className="h-10 w-16 object-contain border rounded bg-muted/30"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Vervangen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => update("logo", null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Logo uploaden
                </Button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadImage(f, "logo");
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {imageError && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {imageError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="badge-font">Lettertype</Label>
            <select
              id="badge-font"
              value={design.font}
              onChange={(e) => update("font", e.target.value as BadgeFontId)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {(Object.keys(BADGE_FONTS) as BadgeFontId[]).map((id) => (
                <option key={id} value={id}>
                  {BADGE_FONTS[id].label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bg-color">Achtergrond</Label>
            {design.background_image ? (
              // An image replaces the colour entirely (the PDF paints the
              // image over the colour), so show only one control at a time.
              <div className="flex items-center gap-2">
                <img
                  src={design.background_image}
                  alt=""
                  className="h-10 w-16 object-cover border rounded"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bgInputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update("background_image", null)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={design.background_color}
                  onChange={(e) =>
                    update("background_color", e.target.value.toUpperCase())
                  }
                  className="h-10 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={design.background_color}
                  onChange={(e) =>
                    update("background_color", e.target.value.toUpperCase())
                  }
                  className="font-mono uppercase w-28"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bgInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Afbeelding gebruiken
                </Button>
              </div>
            )}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadImage(f, "background_image");
                e.target.value = "";
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="text-color">Tekstkleur</Label>
              <div className="flex items-center gap-2">
                <input
                  id="text-color"
                  type="color"
                  value={design.text_color}
                  onChange={(e) =>
                    update("text_color", e.target.value.toUpperCase())
                  }
                  className="h-10 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={design.text_color}
                  onChange={(e) =>
                    update("text_color", e.target.value.toUpperCase())
                  }
                  className="font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold">2. Velden</h2>
            <p className="text-xs text-muted-foreground">
              Welke deelnemergegevens op de badge komen.
            </p>
          </div>
          <div className="space-y-2">
            {ALL_FIELDS.map((f) => {
              const checked = design.fields.includes(f);
              return (
                <label
                  key={f}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition-colors",
                    checked
                      ? "border-foreground/30 bg-muted/40"
                      : "border-input hover:bg-muted/20",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={checked}
                    onChange={() => toggleField(f)}
                  />
                  <span className="text-sm">{FIELD_LABELS[f]}</span>
                </label>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold">3. Indeling</h2>
            <p className="text-xs text-muted-foreground">
              Versleep tekst in het voorbeeld om hem te verplaatsen. Klik op
              een blok voor grootte en uitlijning — te lange tekst krimpt
              automatisch zodat hij past.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BLOCK_LABELS) as BadgeBlock[])
              .filter(blockVisible)
              .map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBlock(b)}
                  className={cn(
                    "px-2.5 py-1 rounded-md border text-xs transition-colors",
                    selectedBlock === b
                      ? "border-foreground/40 bg-muted font-medium"
                      : "border-input hover:bg-muted/40",
                  )}
                >
                  {BLOCK_LABELS[b]}
                </button>
              ))}
          </div>

          {selectedBlock && blockVisible(selectedBlock) && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tekstgrootte</Label>
                <div className="flex gap-1">
                  {(
                    [
                      ["small", "Klein"],
                      ["medium", "Normaal"],
                      ["large", "Groot"],
                    ] as [SizePreset, string][]
                  ).map(([preset, label]) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        updateBlock(selectedBlock, {
                          sizeMm: SIZE_PRESETS[preset],
                        })
                      }
                      className={cn(
                        "px-3 h-9 rounded-md border text-sm transition-colors",
                        design.layout[selectedBlock].sizeMm ===
                          SIZE_PRESETS[preset]
                          ? "border-foreground/40 bg-muted font-medium"
                          : "border-input hover:bg-muted/40",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Uitlijning</Label>
                <div className="flex gap-1">
                  {(
                    [
                      ["left", AlignLeft],
                      ["center", AlignCenter],
                      ["right", AlignRight],
                    ] as [TextAlign, typeof AlignLeft][]
                  ).map(([a, Icon]) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => updateBlock(selectedBlock, { align: a })}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                        design.layout[selectedBlock].align === a
                          ? "border-foreground/40 bg-muted"
                          : "border-input hover:bg-muted/40",
                      )}
                      aria-label={`Lijn ${a} uit`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDesign((d) => ({ ...d, layout: DEFAULT_LAYOUT }));
              setSavedAt(null);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Indeling herstellen
          </Button>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold">4. Achterkant</h2>
            <p className="text-xs text-muted-foreground">
              Na het vouwen is de badge dubbelzijdig.
            </p>
          </div>

          <label
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition-colors",
              design.back_same
                ? "border-foreground/30 bg-muted/40"
                : "border-input hover:bg-muted/20",
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={design.back_same}
              onChange={() => update("back_same", !design.back_same)}
            />
            <span className="text-sm">Achterkant is gelijk aan de voorkant</span>
          </label>

          {!design.back_same && (
            <div className="space-y-2">
              <Label>Afbeelding voor de achterkant</Label>
              <div className="flex items-center gap-2">
                {design.back_image ? (
                  <>
                    <img
                      src={design.back_image}
                      alt=""
                      className="h-14 w-10 object-cover border rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => backInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => update("back_image", null)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => backInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Afbeelding uploaden
                  </Button>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadImage(f, "back_image");
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Een vaste afbeelding op de achterkant van elke badge — bijv.
                het programma, een plattegrond of de wifi-code. Staand
                formaat werkt het best (96 × 134 mm).
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-2">
          {saveError && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {saveError}
            </p>
          )}
          {genError && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {genError}
            </p>
          )}
          {mode === "wizard" ? (
            <div className="flex flex-wrap gap-2 justify-between">
              <Button
                variant="ghost"
                onClick={() => onFinish?.()}
                disabled={saving}
              >
                Nu overslaan
              </Button>
              <Button onClick={onSaveAndFinish} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Opslaan…" : "Opslaan en afronden"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onSave} disabled={saving || !isDirty}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving
                    ? "Opslaan…"
                    : savedAt && !isDirty
                      ? "Opgeslagen"
                      : "Ontwerp opslaan"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onGenerate}
                  disabled={generating || attendeeCount === 0}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {generating
                    ? "Genereren…"
                    : `Alles downloaden (${attendeeCount} ${attendeeCount === 1 ? "badge" : "badges"})`}
                </Button>
              </div>
              {attendeeCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upload een CSV om alle badges in één keer te kunnen downloaden.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <div className="sticky top-6">
          <Card className="p-6 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm">Live voorbeeld</h3>
                <p className="text-xs text-muted-foreground">
                  {BADGE_DIMENSIONS_MM[design.type].label}
                  {sampleAttendee
                    ? " · met je eerste deelnemer als voorbeeld"
                    : " · met voorbeeldgegevens"}
                </p>
              </div>
            </div>
            <div className="flex justify-center items-center min-h-[340px] rounded-md p-6 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]">
              <BadgePreview
                design={design}
                attendee={previewAttendee}
                edit={{
                  selectedBlock,
                  onSelectBlock: setSelectedBlock,
                  onMoveBlock: (b, yMm) => updateBlock(b, { yMm }),
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Wat je ziet is wat er print — op maat voor de Epson
              ColorWorks C4000.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
