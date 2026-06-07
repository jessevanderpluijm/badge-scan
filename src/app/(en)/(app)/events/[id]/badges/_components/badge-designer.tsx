"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Loader2,
  Download,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  ALL_FIELDS,
  BADGE_DIMENSIONS_MM,
  FIELD_LABELS,
  generateBadgePdf,
  type AttendeeForBadge,
  type BadgeDesign,
  type BadgeField,
  type BadgeType,
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
  first_name: "Sample",
  last_name: "Attendee",
  email: "sample@example.com",
  company: "Acme Inc.",
  job_title: "Product Manager",
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

  const [design, setDesign] = useState<BadgeDesign>(initialDesign);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sampling, setSampling] = useState(false);
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
    target: "logo" | "background_image",
  ) {
    setImageError(null);
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setImageError("Use a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(
        `Image is too large (${Math.round(file.size / 1024)} KB). Max 500 KB.`,
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
        throw new Error("No attendees to print. Upload a CSV first.");
      }
      await downloadPdf(rows as AttendeeForBadge[], `badges-${safeEventName}.pdf`);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function onDownloadSample() {
    setSampling(true);
    setGenError(null);
    try {
      await downloadPdf([previewAttendee], `badge-sample-${safeEventName}.pdf`);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    } finally {
      setSampling(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">1. Badge type</h2>
              <p className="text-xs text-muted-foreground">
                Determines the print dimensions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(BADGE_DIMENSIONS_MM) as BadgeType[]).map((t) => {
              const dims = BADGE_DIMENSIONS_MM[t];
              const selected = design.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update("type", t)}
                  className={cn(
                    "border rounded-lg p-3 text-left transition-colors",
                    selected
                      ? "border-foreground bg-muted/40"
                      : "border-input hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {t}
                    </span>
                    {selected && (
                      <Check className="h-4 w-4 text-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dims.pageWidth} × {dims.pageHeight} mm
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold">2. Branding</h2>
            <p className="text-xs text-muted-foreground">
              Logo, colors, and optional background.
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
                    Replace
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
                  Upload logo
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

          <div className="space-y-2">
            <Label>Background image (optional)</Label>
            <div className="flex items-center gap-2">
              {design.background_image ? (
                <>
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
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bgInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload background
                </Button>
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
          </div>

          {imageError && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> {imageError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background color</Label>
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
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-color">Text color</Label>
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
            <h2 className="font-semibold">3. Fields</h2>
            <p className="text-xs text-muted-foreground">
              Which attendee data to show on the badge.
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
                Skip for now
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={onDownloadSample}
                  disabled={sampling}
                >
                  {sampling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {sampling ? "Generating…" : "Preview"}
                </Button>
                <Button onClick={onSaveAndFinish} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : "Save & finish"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onSave} disabled={saving || !isDirty}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving
                    ? "Saving…"
                    : savedAt && !isDirty
                      ? "Saved"
                      : "Save design"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onDownloadSample}
                  disabled={sampling}
                >
                  {sampling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {sampling ? "Generating…" : "Download sample"}
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
                    ? "Generating…"
                    : `Download all (${attendeeCount} ${attendeeCount === 1 ? "badge" : "badges"})`}
                </Button>
              </div>
              {attendeeCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sample download works without attendees. Upload a CSV to
                  enable the full batch.
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
                <h3 className="font-semibold text-sm">Live preview</h3>
                <p className="text-xs text-muted-foreground">
                  {BADGE_DIMENSIONS_MM[design.type].label}
                  {sampleAttendee
                    ? " · using first attendee as sample"
                    : " · using placeholder data"}
                </p>
              </div>
            </div>
            <div className="flex justify-center items-center min-h-[340px] rounded-md p-6 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]">
              <BadgePreview design={design} attendee={previewAttendee} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Output: PDF, exact mm dimensions, one badge per page —
              ready for the Epson ColorWorks C4000.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
