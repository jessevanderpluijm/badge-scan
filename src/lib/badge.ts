import {
  PDFDocument,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
  type PDFFont,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Inter ships in public/fonts and gets fetched + embedded into each badge
// PDF. Why we don't use pdf-lib's StandardFonts.Helvetica anymore: Helvetica
// is hard-wired to WinAnsi encoding, which silently breaks any non-Latin-1
// glyph (Polish 'ł', Turkish 'ı', anything Cyrillic / CJK). Inter covers
// the full latin block — plus pdf-lib subsets so each PDF stays small.
async function fetchFontBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// The platform currently supports exactly one badge product: the ExpoBadge
// 260T that our reference setup (Epson ColorWorks C4000e) prints on. Keep
// the union so re-adding formats later is a type-level change, but don't
// offer choices we can't support in production.
export type BadgeType = "butterfly260t";
export type BadgeField =
  | "first_name"
  | "last_name"
  | "company"
  | "job_title"
  | "email";

// Curated font set. Every family ships as a local file in public/fonts so
// the PDF embed and the on-screen preview render the exact same glyphs —
// a Google Fonts picker would break that guarantee offline at the door.
export type BadgeFontId = "inter" | "lora" | "space-grotesk" | "playfair";

export const BADGE_FONTS: Record<
  BadgeFontId,
  { label: string; regular: string; bold: string; css: string }
> = {
  inter: {
    label: "Inter",
    regular: "/fonts/Inter-Regular.woff",
    bold: "/fonts/Inter-Bold.woff",
    css: "'Badge Inter', sans-serif",
  },
  "space-grotesk": {
    label: "Space Grotesk",
    regular: "/fonts/SpaceGrotesk-Regular.ttf",
    bold: "/fonts/SpaceGrotesk-Bold.ttf",
    css: "'Badge Space Grotesk', sans-serif",
  },
  lora: {
    label: "Lora",
    regular: "/fonts/Lora-Regular.ttf",
    bold: "/fonts/Lora-Bold.ttf",
    css: "'Badge Lora', serif",
  },
  playfair: {
    label: "Playfair Display",
    regular: "/fonts/PlayfairDisplay-Regular.ttf",
    bold: "/fonts/PlayfairDisplay-Bold.ttf",
    css: "'Badge Playfair', serif",
  },
};

export type TextAlign = "left" | "center" | "right";

// A movable text block on the badge front. yMm is the distance from the
// top of the badge face to the top of the text; sizeMm is the font size.
export type BadgeTextStyle = {
  yMm: number;
  sizeMm: number;
  align: TextAlign;
};

// The name (first + last on one line) is one block; every secondary field
// is its own block. Whether a block prints at all is still governed by
// design.fields — the layout only says where and how big.
export type BadgeBlock = "name" | "company" | "job_title" | "email";

export type BadgeLayout = Record<BadgeBlock, BadgeTextStyle>;

// Mirrors the old fixed flow (logo at top, name under it, details below)
// so designs saved before the layout editor keep printing the same.
export const DEFAULT_LAYOUT: BadgeLayout = {
  name: { yMm: 21, sizeMm: 8, align: "center" },
  company: { yMm: 32, sizeMm: 3.5, align: "center" },
  job_title: { yMm: 37, sizeMm: 3.5, align: "center" },
  email: { yMm: 42, sizeMm: 3.5, align: "center" },
};

export const BLOCK_LABELS: Record<BadgeBlock, string> = {
  name: "Name",
  company: "Company",
  job_title: "Function",
  email: "Email",
};

export type BadgeDesign = {
  type: BadgeType;
  background_color: string;
  text_color: string;
  logo: string | null;
  background_image: string | null;
  fields: BadgeField[];
  font: BadgeFontId;
  layout: BadgeLayout;
  // The badge back: identical to the front (default), or a static
  // full-face image — handy for programme info, floor plans, wifi codes.
  back_same: boolean;
  back_image: string | null;
};

// A panel is one copy of the design on a printed page. Offsets are from
// the bottom-left of the page (PDF coordinate space). `rotated` panels are
// printed upside-down: a badge half that becomes the back face after
// folding only reads upright on the lanyard when its print is rotated 180°.
export type BadgePanel = {
  xMm: number;
  yMm: number;
  rotated: boolean;
  face: "front" | "back";
};

// A badge can span multiple printed pages. The ExpoBadge 260T is one badge
// per TWO labels: the printer sees two ~134 mm die-cut labels, the organizer
// folds them at the middle perforation and the self-adhesive backs stick
// together into one rigid double-sided badge. Page 1 = front (upright),
// page 2 = back (rotated 180° so it reads upright on the lanyard).
export const BADGE_DIMENSIONS_MM: Record<
  BadgeType,
  {
    name: string;
    pageWidth: number;
    pageHeight: number;
    panelWidth: number;
    panelHeight: number;
    pages: BadgePanel[][];
    label: string;
  }
> = {
  butterfly260t: {
    name: "Butterfly 260T",
    // ONE page spans the whole 2-label badge. The labels sit BUTT-JOINED
    // on the roll (only a perforation between them, no gap — measured on
    // the physical media with a printed ruler): pitch 134 mm per label,
    // badge = 268 mm. The C4000e inserts a blank label between separate
    // pages of a job, so front and back must live on a single page.
    //
    // Full-bleed geometry (calibrated against Jesse's printer):
    // - Width 104: the 96 mm label centered with 4 mm phantom bleed per
    //   side, so ink runs over the die-cut edges onto the liner.
    // - Height 269 = 268 + 1 mm: the head can't ink the last ~1 mm of a
    //   job (dead tail at the eject clamp). The extra millimetre pushes
    //   that dead zone past the cut; the printer's Cut Position setting
    //   of -1.0 mm pulls the cut back onto the perforation at 268.
    // - Panel positions ride on the printer's Print Position Adjustment
    //   (Top +2.5 / Left -0.5) — the page itself starts at the label edge.
    pageWidth: 104,
    pageHeight: 269,
    panelWidth: 96,
    panelHeight: 134,
    // Per DCP's layout (confirmed against a hand-annotated badge): the
    // front face has its name at the SLOT end, the back face at the FOLD
    // end, both in the SAME reading direction — you read the back by
    // flipping the hanging badge UP, not by spinning it around. On the
    // flat strip that makes both labels carry an identical print: name at
    // each label's leading edge. The C4000 lays a page down with its top
    // at the trailing edge, hence two identical 180°-rotated panels.
    // Page bottom = leading edge. Label 1 occupies y 0–134, label 2
    // starts right at 134 — contiguous, so no vertical bleed is needed
    // at the seam (overlap there would double-print as a dark stripe).
    pages: [
      [
        { xMm: 4, yMm: 0, rotated: true, face: "front" },
        { xMm: 4, yMm: 134, rotated: true, face: "back" },
      ],
    ],
    label:
      "Butterfly 96,5 × 134 mm (ExpoBadge 260T · front + back on 2 labels)",
  },
};

export const FIELD_LABELS: Record<BadgeField, string> = {
  first_name: "First name",
  last_name: "Last name",
  company: "Company",
  job_title: "Function",
  email: "Email",
};

export const ALL_FIELDS: BadgeField[] = [
  "first_name",
  "last_name",
  "company",
  "job_title",
  "email",
];

export const DEFAULT_DESIGN: BadgeDesign = {
  type: "butterfly260t",
  background_color: "#FFFFFF",
  text_color: "#0F172A",
  logo: null,
  background_image: null,
  fields: ["first_name", "last_name", "company", "job_title"],
  font: "inter",
  layout: DEFAULT_LAYOUT,
  back_same: true,
  back_image: null,
};

const BLOCK_KEYS: BadgeBlock[] = ["name", "company", "job_title", "email"];

function normalizeTextStyle(
  stored: Partial<BadgeTextStyle> | undefined,
  fallback: BadgeTextStyle,
): BadgeTextStyle {
  const clamp = (v: unknown, lo: number, hi: number, dflt: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(hi, Math.max(lo, v))
      : dflt;
  return {
    yMm: clamp(stored?.yMm, 0, 125, fallback.yMm),
    sizeMm: clamp(stored?.sizeMm, 2, 20, fallback.sizeMm),
    align: (["left", "center", "right"] as const).includes(
      stored?.align as TextAlign,
    )
      ? (stored?.align as TextAlign)
      : fallback.align,
  };
}

// Stored designs can predate the current badge model (retired types, removed
// fields). Every consumer of events.badge_design should run it through this.
export function normalizeBadgeDesign(
  stored: Partial<BadgeDesign> | null | undefined,
): BadgeDesign {
  const s = stored ?? {};
  const layout = Object.fromEntries(
    BLOCK_KEYS.map((k) => [
      k,
      normalizeTextStyle(s.layout?.[k], DEFAULT_LAYOUT[k]),
    ]),
  ) as BadgeLayout;
  return {
    ...DEFAULT_DESIGN,
    ...s,
    type: DEFAULT_DESIGN.type,
    fields: (s.fields ?? DEFAULT_DESIGN.fields).filter(
      (f): f is BadgeField => ALL_FIELDS.includes(f as BadgeField),
    ),
    font: s.font && s.font in BADGE_FONTS ? s.font : "inter",
    layout,
    back_same: s.back_same ?? true,
    back_image: s.back_image ?? null,
  };
}

export type AttendeeForBadge = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  job_title: string | null;
  barcode: string;
};

const MM_TO_PT = 2.834645669;
const mmToPt = (mm: number) => mm * MM_TO_PT;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return {
    r: ((num >> 16) & 0xff) / 255,
    g: ((num >> 8) & 0xff) / 255,
    b: (num & 0xff) / 255,
  };
}

function attendeeFieldValue(
  attendee: AttendeeForBadge,
  field: BadgeField,
): string {
  if (field === "first_name") return attendee.first_name ?? "";
  if (field === "last_name") return attendee.last_name ?? "";
  if (field === "company") return attendee.company ?? "";
  if (field === "job_title") return attendee.job_title ?? "";
  return attendee.email ?? "";
}

async function embedDataUrl(
  pdf: PDFDocument,
  dataUrl: string,
): Promise<
  | { kind: "png"; image: Awaited<ReturnType<typeof pdf.embedPng>> }
  | { kind: "jpg"; image: Awaited<ReturnType<typeof pdf.embedJpg>> }
  | null
> {
  const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const fmt = match[1];
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  if (fmt === "png") {
    return { kind: "png", image: await pdf.embedPng(bytes) };
  }
  return { kind: "jpg", image: await pdf.embedJpg(bytes) };
}

// Draw one layout block at its absolute position. The y in the style is
// measured from the panel TOP (how the designer thinks); PDF space runs
// bottom-up, so it flips here. Text wider than the panel shrinks to fit —
// a long name must never run off the label.
function drawTextBlock(opts: {
  page: ReturnType<PDFDocument["addPage"]>;
  text: string;
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  style: BadgeTextStyle;
  font: PDFFont;
  color: { r: number; g: number; b: number };
}) {
  const { page, text, panelX, panelY, panelW, panelH, style, font, color } =
    opts;
  if (!text) return;
  const padding = mmToPt(4);
  const maxWidth = panelW - padding * 2;
  let fontSize = mmToPt(style.sizeMm);
  while (
    font.widthOfTextAtSize(text, fontSize) > maxWidth &&
    fontSize > mmToPt(2)
  ) {
    fontSize -= 1;
  }
  const width = font.widthOfTextAtSize(text, fontSize);
  const x =
    style.align === "left"
      ? panelX + padding
      : style.align === "right"
        ? panelX + panelW - padding - width
        : panelX + (panelW - width) / 2;
  const y = panelY + panelH - mmToPt(style.yMm) - fontSize;
  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}

type EmbeddedImage = NonNullable<Awaited<ReturnType<typeof embedDataUrl>>>;

function drawPanel(opts: {
  page: ReturnType<PDFDocument["addPage"]>;
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  attendee: AttendeeForBadge;
  design: BadgeDesign;
  bgImage: EmbeddedImage | null;
  logo: EmbeddedImage | null;
  fg: { r: number; g: number; b: number };
  regularFont: PDFFont;
  boldFont: PDFFont;
}) {
  const {
    page,
    panelX,
    panelY,
    panelW,
    panelH,
    attendee,
    design,
    bgImage,
    logo,
    fg,
    regularFont,
    boldFont,
  } = opts;

  const padding = mmToPt(4);

  if (bgImage) {
    // Cover the panel plus 4mm bleed left and right (into the phantom
    // page width), so the background runs over the die-cut side edges.
    // No vertical bleed: the two panels are butt-joined at the fold, and
    // overlapping ink there prints twice and shows as a dark stripe.
    const bleed = mmToPt(4);
    const bx = panelX - bleed;
    const by = panelY;
    const bw = panelW + bleed * 2;
    const bh = panelH;
    const ratio = bgImage.image.width / bgImage.image.height;
    const areaRatio = bw / bh;
    let w: number, h: number, x: number, y: number;
    if (ratio > areaRatio) {
      h = bh;
      w = bh * ratio;
      x = bx + (bw - w) / 2;
      y = by;
    } else {
      w = bw;
      h = bw / ratio;
      x = bx;
      y = by + (bh - h) / 2;
    }
    page.drawImage(bgImage.image, { x, y, width: w, height: h });
  }

  if (logo) {
    const maxLogoH = mmToPt(14);
    const maxLogoW = panelW - padding * 2;
    const ratio = logo.image.width / logo.image.height;
    let logoH = maxLogoH;
    let logoW = logoH * ratio;
    if (logoW > maxLogoW) {
      logoW = maxLogoW;
      logoH = logoW / ratio;
    }
    const logoX = panelX + (panelW - logoW) / 2;
    const logoY = panelY + panelH - padding - logoH;
    page.drawImage(logo.image, {
      x: logoX,
      y: logoY,
      width: logoW,
      height: logoH,
    });
  }

  const primaryFields = design.fields.filter(
    (f) => f === "first_name" || f === "last_name",
  );
  const nameText = primaryFields
    .map((f) => attendeeFieldValue(attendee, f))
    .filter(Boolean)
    .join(" ");

  const common = { page, panelX, panelY, panelW, panelH, color: fg };

  if (nameText) {
    drawTextBlock({
      ...common,
      text: nameText,
      style: design.layout.name,
      font: boldFont,
    });
  }
  for (const f of ["company", "job_title", "email"] as const) {
    if (!design.fields.includes(f)) continue;
    drawTextBlock({
      ...common,
      text: attendeeFieldValue(attendee, f),
      style: design.layout[f],
      font: regularFont,
    });
  }
}

export async function generateBadgePdf(
  design: BadgeDesign,
  attendees: AttendeeForBadge[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontFiles = BADGE_FONTS[design.font] ?? BADGE_FONTS.inter;
  const [regularBytes, boldBytes] = await Promise.all([
    fetchFontBytes(fontFiles.regular),
    fetchFontBytes(fontFiles.bold),
  ]);
  const regularFont = await pdf.embedFont(regularBytes, { subset: true });
  const boldFont = await pdf.embedFont(boldBytes, { subset: true });

  const dims = BADGE_DIMENSIONS_MM[design.type];
  const pageW = mmToPt(dims.pageWidth);
  const pageH = mmToPt(dims.pageHeight);
  const panelW = mmToPt(dims.panelWidth);
  const panelH = mmToPt(dims.panelHeight);
  const bg = hexToRgb(design.background_color);
  const fg = hexToRgb(design.text_color);

  const bgImage = design.background_image
    ? await embedDataUrl(pdf, design.background_image)
    : null;
  const logo = design.logo ? await embedDataUrl(pdf, design.logo) : null;
  const backImage =
    !design.back_same && design.back_image
      ? await embedDataUrl(pdf, design.back_image)
      : null;

  // Draw an image covering the full panel plus 4mm horizontal bleed
  // (like CSS object-fit: cover), so backgrounds run over the die-cut
  // side edges. Vertically the panels are butt-joined — no bleed there.
  const drawCover = (
    page: ReturnType<PDFDocument["addPage"]>,
    img: EmbeddedImage,
    x: number,
    y: number,
  ) => {
    const bleed = mmToPt(4);
    const bx = x - bleed;
    const by = y;
    const bw = panelW + bleed * 2;
    const bh = panelH;
    const ratio = img.image.width / img.image.height;
    const areaRatio = bw / bh;
    let w: number, h: number, dx: number, dy: number;
    if (ratio > areaRatio) {
      h = bh;
      w = bh * ratio;
      dx = bx + (bw - w) / 2;
      dy = by;
    } else {
      w = bw;
      h = bw / ratio;
      dx = bx;
      dy = by + (bh - h) / 2;
    }
    page.drawImage(img.image, { x: dx, y: dy, width: w, height: h });
  };

  for (const attendee of attendees) {
    for (const pagePanels of dims.pages) {
      const page = pdf.addPage([pageW, pageH]);

      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageW,
        height: pageH,
        color: rgb(bg.r, bg.g, bg.b),
      });

      for (const panel of pagePanels) {
        const panelX = mmToPt(panel.xMm);
        const panelY = mmToPt(panel.yMm);

        if (panel.rotated) {
          // Rotate this panel 180° about its own centre by concatenating a
          // (-1, 0, 0, -1, 2cx, 2cy) matrix onto the CTM, so drawPanel can
          // keep drawing in normal upright coordinates.
          const cx = panelX + panelW / 2;
          const cy = panelY + panelH / 2;
          page.pushOperators(
            pushGraphicsState(),
            concatTransformationMatrix(-1, 0, 0, -1, 2 * cx, 2 * cy),
          );
        }

        if (panel.face === "back" && !design.back_same) {
          // Static back: just the uploaded image (or the plain background
          // colour when none is set) — no attendee data.
          if (backImage) drawCover(page, backImage, panelX, panelY);
        } else {
          drawPanel({
            page,
            panelX,
            panelY,
            panelW,
            panelH,
            attendee,
            design,
            bgImage,
            logo,
            fg,
            regularFont,
            boldFont,
          });
        }

        if (panel.rotated) {
          page.pushOperators(popGraphicsState());
        }
      }
    }
  }

  return await pdf.save();
}
