"use client";

import { ImageIcon } from "lucide-react";
import {
  BADGE_DIMENSIONS_MM,
  type AttendeeForBadge,
  type BadgeDesign,
  type BadgeField,
} from "@/lib/badge";

const PX_PER_MM = 3.5;

function fieldValue(attendee: AttendeeForBadge, f: BadgeField) {
  if (f === "first_name") return attendee.first_name ?? "";
  if (f === "last_name") return attendee.last_name ?? "";
  if (f === "company") return attendee.company ?? "";
  if (f === "job_title") return attendee.job_title ?? "";
  return attendee.email ?? "";
}

// One badge face as the wearer sees it (print rotation is a physical
// concern of the strip layout, not of this on-screen preview).
function FrontFace({
  design,
  attendee,
  w,
  h,
}: {
  design: BadgeDesign;
  attendee: AttendeeForBadge;
  w: number;
  h: number;
}) {
  const padding = 4 * PX_PER_MM;

  const primaryFields = design.fields.filter(
    (f) => f === "first_name" || f === "last_name",
  );
  const secondaryFields = design.fields.filter(
    (f) => f !== "first_name" && f !== "last_name",
  );
  const primaryText = primaryFields
    .map((f) => fieldValue(attendee, f))
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="relative overflow-hidden shadow-lg rounded-sm"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: design.background_color,
        color: design.text_color,
      }}
    >
      {design.background_image && (
        <img
          src={design.background_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div
        className="relative h-full flex flex-col items-center text-center"
        style={{ padding: `${padding}px` }}
      >
        {design.logo && (
          <img
            src={design.logo}
            alt=""
            className="object-contain"
            style={{
              maxHeight: `${14 * PX_PER_MM}px`,
              maxWidth: "100%",
              marginBottom: `${3 * PX_PER_MM}px`,
            }}
          />
        )}

        <div className="flex flex-col items-center w-full">
          {primaryText && (
            <div
              className="font-bold leading-tight break-words w-full"
              style={{ fontSize: `${7 * PX_PER_MM}px` }}
            >
              {primaryText}
            </div>
          )}
          {secondaryFields.map((f) => {
            const v = fieldValue(attendee, f);
            if (!v) return null;
            return (
              <div
                key={f}
                className="opacity-80 break-words w-full"
                style={{
                  fontSize: `${3.5 * PX_PER_MM}px`,
                  marginTop: `${1.5 * PX_PER_MM}px`,
                }}
              >
                {v}
              </div>
            );
          })}
        </div>
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
    <div
      className="relative overflow-hidden shadow-lg rounded-sm"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: design.background_color,
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
  );
}

export function BadgePreview({
  design,
  attendee,
}: {
  design: BadgeDesign;
  attendee: AttendeeForBadge;
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
        <FrontFace design={design} attendee={attendee} w={w} h={h} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground text-center">
          Front
        </p>
        <FrontFace design={design} attendee={attendee} w={w} h={h} />
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
