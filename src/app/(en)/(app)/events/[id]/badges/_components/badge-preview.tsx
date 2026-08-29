"use client";

import { useRef } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BADGE_DIMENSIONS_MM,
  BADGE_FONTS,
  type AttendeeForBadge,
  type BadgeBlock,
  type BadgeDesign,
  type BadgeField,
} from "@/lib/badge";

const PX_PER_MM = 3.5;

// The 260T badge is die-cut with three hanger punches at the top of each
// face: two 14×3mm lanyard slots and a euro-style hook cutout in the
// middle. The preview punches them out with a CSS mask so the designer
// sees exactly where text must not go.
function holesMaskStyle(w: number, h: number): React.CSSProperties {
  const mm = PX_PER_MM;
  const slot = (x: number) =>
    `<rect x='${x * mm}' y='${7.5 * mm}' width='${14 * mm}' height='${3 * mm}' rx='${1.5 * mm}' fill='black'/>`;
  // CSS masks use the ALPHA channel, so the holes must be genuinely
  // transparent in the mask image — hence an inner SVG <mask> (white
  // keeps, black cuts) applied to a white rect.
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<mask id='m'>` +
    `<rect width='100%' height='100%' fill='white'/>` +
    slot(13) +
    slot(69) +
    // euro hook: narrow opening at the top edge widening into a slot
    `<rect x='${44 * mm}' y='0' width='${8 * mm}' height='${5.5 * mm}' fill='black'/>` +
    `<rect x='${40.5 * mm}' y='${4 * mm}' width='${15 * mm}' height='${3.5 * mm}' rx='${1.75 * mm}' fill='black'/>` +
    `</mask>` +
    `<rect width='100%' height='100%' fill='white' mask='url(#m)'/>` +
    `</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { WebkitMaskImage: url, maskImage: url };
}

function fieldValue(attendee: AttendeeForBadge, f: BadgeField) {
  if (f === "first_name") return attendee.first_name ?? "";
  if (f === "last_name") return attendee.last_name ?? "";
  if (f === "company") return attendee.company ?? "";
  if (f === "job_title") return attendee.job_title ?? "";
  return attendee.email ?? "";
}

// Layout-editing hooks the designer can pass in: click to select a block,
// drag to move it vertically. Absent (e.g. wizard preview) the face is
// a plain static render.
export type BadgeEditProps = {
  selectedBlock: BadgeBlock | null;
  onSelectBlock: (b: BadgeBlock) => void;
  onMoveBlock: (b: BadgeBlock, yMm: number) => void;
};

// One badge face as the wearer sees it (print rotation is a physical
// concern of the strip layout, not of this on-screen preview).
function FrontFace({
  design,
  attendee,
  w,
  h,
  edit,
}: {
  design: BadgeDesign;
  attendee: AttendeeForBadge;
  w: number;
  h: number;
  edit?: BadgeEditProps;
}) {
  const padding = 4 * PX_PER_MM;
  const drag = useRef<{ block: BadgeBlock; startY: number; startMm: number } | null>(
    null,
  );

  const primaryText = design.fields
    .filter((f) => f === "first_name" || f === "last_name")
    .map((f) => fieldValue(attendee, f))
    .filter(Boolean)
    .join(" ");

  const blocks: { key: BadgeBlock; text: string; bold: boolean }[] = [];
  if (primaryText) blocks.push({ key: "name", text: primaryText, bold: true });
  for (const f of ["company", "job_title", "email"] as const) {
    if (!design.fields.includes(f)) continue;
    const v = fieldValue(attendee, f);
    if (v) blocks.push({ key: f, text: v, bold: false });
  }

  return (
    // The shadow lives on a wrapper: the punch-hole mask on the face
    // itself would otherwise clip the shadow away.
    <div className="shadow-lg rounded-sm">
    <div
      className="relative overflow-hidden rounded-sm"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: design.background_color,
        color: design.text_color,
        fontFamily: BADGE_FONTS[design.font].css,
        ...holesMaskStyle(w, h),
      }}
    >
      {design.background_image && (
        <img
          src={design.background_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {design.logo && (
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: `${padding}px` }}
        >
          <img
            src={design.logo}
            alt=""
            className="object-contain"
            style={{
              maxHeight: `${14 * PX_PER_MM}px`,
              maxWidth: `${w - padding * 2}px`,
            }}
          />
        </div>
      )}

      {blocks.map(({ key, text, bold }) => {
        const style = design.layout[key];
        const selected = edit?.selectedBlock === key;
        return (
          <div
            key={key}
            className={cn(
              "absolute whitespace-nowrap leading-tight select-none",
              bold ? "font-bold" : "opacity-80",
              edit &&
                "cursor-grab active:cursor-grabbing rounded-sm transition-shadow",
              selected && "ring-2 ring-blue-500/80 ring-offset-1",
            )}
            style={{
              top: `${style.yMm * PX_PER_MM}px`,
              left: `${padding}px`,
              width: `${w - padding * 2}px`,
              fontSize: `${style.sizeMm * PX_PER_MM}px`,
              textAlign: style.align,
              touchAction: edit ? "none" : undefined,
            }}
            onPointerDown={
              edit
                ? (e) => {
                    e.preventDefault();
                    edit.onSelectBlock(key);
                    drag.current = {
                      block: key,
                      startY: e.clientY,
                      startMm: style.yMm,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }
                : undefined
            }
            onPointerMove={
              edit
                ? (e) => {
                    const d = drag.current;
                    if (!d || d.block !== key) return;
                    const deltaMm = (e.clientY - d.startY) / PX_PER_MM;
                    const next = Math.min(
                      125,
                      Math.max(0, d.startMm + deltaMm),
                    );
                    edit.onMoveBlock(key, Math.round(next * 2) / 2);
                  }
                : undefined
            }
            onPointerUp={edit ? () => (drag.current = null) : undefined}
          >
            {text}
          </div>
        );
      })}
    </div>
    </div>
  );
}

function BackFace({
  design,
  w,
  h,
}: {
  design: BadgeDesign;
  w: number;
  h: number;
}) {
  return (
    <div className="shadow-lg rounded-sm">
    <div
      className="relative overflow-hidden rounded-sm"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: design.background_color,
        ...holesMaskStyle(w, h),
      }}
    >
      {design.back_image ? (
        <img
          src={design.back_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="h-8 w-8 opacity-40" />
          <p className="text-xs px-6 text-center">
            No back image yet — upload one, or the back stays blank.
          </p>
        </div>
      )}
    </div>
    </div>
  );
}

export function BadgePreview({
  design,
  attendee,
  edit,
}: {
  design: BadgeDesign;
  attendee: AttendeeForBadge;
  edit?: BadgeEditProps;
}) {
  const dims = BADGE_DIMENSIONS_MM[design.type];
  const w = dims.panelWidth * PX_PER_MM;
  const h = dims.panelHeight * PX_PER_MM;

  if (design.back_same) {
    // Front and back are identical — one preview says it all.
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground text-center">
          Front &amp; back
        </p>
        <FrontFace
          design={design}
          attendee={attendee}
          w={w}
          h={h}
          edit={edit}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground text-center">
          Front
        </p>
        <FrontFace
          design={design}
          attendee={attendee}
          w={w}
          h={h}
          edit={edit}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground text-center">
          Back
        </p>
        <BackFace design={design} w={w} h={h} />
      </div>
    </div>
  );
}
