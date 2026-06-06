"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FieldKey =
  | "first_name"
  | "last_name"
  | "email"
  | "company"
  | "job_title"
  | "barcode";

const FIELDS: { key: FieldKey; label: string; required: boolean }[] = [
  { key: "barcode", label: "Barcode", required: true },
  { key: "first_name", label: "First name", required: false },
  { key: "last_name", label: "Last name", required: false },
  { key: "email", label: "Email", required: false },
  { key: "company", label: "Company", required: false },
  { key: "job_title", label: "Function", required: false },
];

type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
};

function guessHeader(headers: string[], field: FieldKey): string {
  const patterns: Record<FieldKey, RegExp[]> = {
    first_name: [/^first.?name$/i, /^firstname$/i, /^given/i, /^voornaam$/i],
    last_name: [
      /^last.?name$/i,
      /^lastname$/i,
      /^surname$/i,
      /^family/i,
      /^achternaam$/i,
    ],
    email: [/^e?.?mail/i],
    company: [/company/i, /organi[sz]ation/i, /^bedrijf$/i, /^organisatie$/i],
    job_title: [
      /^job.?title$/i,
      /^function$/i,
      /^role$/i,
      /^position$/i,
      /^title$/i,
      /^functie$/i,
    ],
    barcode: [/barcode/i, /ticket/i, /code/i, /^id$/i],
  };
  const match = headers.find((h) => patterns[field].some((p) => p.test(h)));
  return match ?? "";
}

export function CsvUpload({
  eventId,
  onComplete,
}: {
  eventId: string;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    job_title: "",
    barcode: "",
  });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    setError(null);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        if (headers.length === 0) {
          setError("CSV has no columns. Make sure the first row has headers.");
          return;
        }
        const rows = res.data.filter((r) =>
          Object.values(r).some((v) => v && String(v).trim()),
        );
        setParsed({ headers, rows, fileName: file.name });
        setMapping({
          first_name: guessHeader(headers, "first_name"),
          last_name: guessHeader(headers, "last_name"),
          email: guessHeader(headers, "email"),
          company: guessHeader(headers, "company"),
          job_title: guessHeader(headers, "job_title"),
          barcode: guessHeader(headers, "barcode"),
        });
      },
      error: (err) => setError(err.message),
    });
  }

  function reset() {
    setParsed(null);
    setMapping({
      first_name: "",
      last_name: "",
      email: "",
      company: "",
      job_title: "",
      barcode: "",
    });
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onImport() {
    if (!parsed) return;
    if (!mapping.barcode) {
      setError("Please map the Barcode column — it's required.");
      return;
    }
    setImporting(true);
    setError(null);

    const seen = new Set<string>();
    const records: Array<{
      event_id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      company: string | null;
      job_title: string | null;
      barcode: string;
    }> = [];

    const pick = (row: Record<string, string>, header: string) =>
      header ? String(row[header] ?? "").trim() || null : null;

    for (const row of parsed.rows) {
      const barcode = String(row[mapping.barcode] ?? "").trim();
      if (!barcode || seen.has(barcode)) continue;
      seen.add(barcode);
      records.push({
        event_id: eventId,
        barcode,
        first_name: pick(row, mapping.first_name),
        last_name: pick(row, mapping.last_name),
        email: pick(row, mapping.email),
        company: pick(row, mapping.company),
        job_title: pick(row, mapping.job_title),
      });
    }

    if (records.length === 0) {
      setError("No rows with a barcode found.");
      setImporting(false);
      return;
    }

    let inserted = 0;
    const chunkSize = 500;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from("attendees")
        .upsert(chunk, {
          onConflict: "event_id,barcode",
          ignoreDuplicates: true,
        })
        .select("id");
      if (error) {
        setError(error.message);
        setImporting(false);
        return;
      }
      inserted += data?.length ?? 0;
    }

    setImporting(false);
    setResult({ inserted, skipped: records.length - inserted });
    router.refresh();
  }

  const totalRows = parsed?.rows.length ?? 0;

  if (parsed) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{parsed.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {totalRows} {totalRows === 1 ? "row" : "rows"} ·{" "}
                {parsed.headers.length} columns
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={importing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-3">
            Map columns to attendee fields
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  {f.label}
                  {f.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Select
                  value={mapping[f.key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [f.key]: e.target.value })
                  }
                >
                  <option value="">— Don't import —</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </div>

        {parsed.rows.length > 0 && mapping.barcode && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Preview (first 3 rows)
            </p>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr className="text-left">
                    {FIELDS.map((f) => (
                      <th
                        key={f.key}
                        className="py-2 px-3 font-medium text-muted-foreground"
                      >
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      {FIELDS.map((f) => {
                        const val = mapping[f.key]
                          ? row[mapping[f.key]]
                          : "";
                        return (
                          <td
                            key={f.key}
                            className={cn(
                              "py-2 px-3",
                              f.key === "barcode" && "font-mono text-xs",
                              !val && "text-muted-foreground",
                            )}
                          >
                            {val || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="flex items-center gap-2 text-sm bg-success/10 text-success rounded-md px-3 py-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Imported {result.inserted}{" "}
              {result.inserted === 1 ? "attendee" : "attendees"}
              {result.skipped > 0 &&
                ` · ${result.skipped} skipped (already in event)`}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          {result ? (
            <>
              <Button variant="outline" onClick={reset}>
                Upload another
              </Button>
              <Button onClick={() => onComplete?.()}>Done</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={reset}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                onClick={onImport}
                disabled={importing || !mapping.barcode}
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                {importing
                  ? "Importing…"
                  : `Import ${totalRows} ${totalRows === 1 ? "row" : "rows"}`}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-10 text-center transition-colors",
        dragging ? "border-foreground/40 bg-muted/40" : "border-muted-foreground/25",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-medium">Drop your CSV here</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        First row should contain column headers. You'll map columns next.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        Choose CSV file
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-3">{error}</p>
      )}
    </div>
  );
}
