"use client";

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

function Panel({
  design,
  attendee,
  widthMm,
  heightMm,
}: {
  design: BadgeDesign;
  attendee: AttendeeForBadge;
  widthMm: number;
  heightMm: number;
}) {
  const w = widthMm * PX_PER_MM;
  const h = heightMm * PX_PER_MM;
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
      className="relative overflow-hidden"
      style={{
        width: `${w}px`,
        height: `${h}px`,
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
        style={{
          paddingTop: `${padding}px`,
          paddingBottom: `${padding}px`,
          paddingLeft: `${padding}px`,
          paddingRight: `${padding}px`,
        }}
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

        <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
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

export function BadgePreview({
  design,
  attendee,
}: {
  design: BadgeDesign;
  attendee: AttendeeForBadge;
}) {
  const dims = BADGE_DIMENSIONS_MM[design.type];
  const pageW = dims.pageWidth * PX_PER_MM;
  const pageH = dims.pageHeight * PX_PER_MM;

  return (
    <div
      className="relative overflow-hidden shadow-lg rounded-sm"
      style={{
        width: `${pageW}px`,
        height: `${pageH}px`,
        backgroundColor: design.background_color,
      }}
    >
      {dims.panels.map((panel, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${panel.xMm * PX_PER_MM}px`,
            // PDF panel offsets are bottom-up; CSS positions top-down.
            top: `${(dims.pageHeight - panel.yMm - dims.panelHeight) * PX_PER_MM}px`,
            transform: panel.rotated ? "rotate(180deg)" : undefined,
          }}
        >
          <Panel
            design={design}
            attendee={attendee}
            widthMm={dims.panelWidth}
            heightMm={dims.panelHeight}
          />
        </div>
      ))}

      {dims.fold === "vertical" && (
        <div
          className="absolute inset-y-0 left-1/2 border-l border-dashed pointer-events-none"
          style={{ borderColor: "rgba(0,0,0,0.25)" }}
          aria-hidden
        />
      )}
      {dims.fold === "horizontal" && (
        <div
          className="absolute inset-x-0 top-1/2 border-t border-dashed pointer-events-none"
          style={{ borderColor: "rgba(0,0,0,0.25)" }}
          aria-hidden
        />
      )}
    </div>
  );
}
