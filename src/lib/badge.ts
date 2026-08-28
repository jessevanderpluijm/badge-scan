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

export type BadgeDesign = {
  type: BadgeType;
  background_color: string;
  text_color: string;
  logo: string | null;
  background_image: string | null;
  fields: BadgeField[];
};

// A panel is one copy of the design on a printed page. Offsets are from
// the bottom-left of the page (PDF coordinate space). `rotated` panels are
// printed upside-down: a badge half that becomes the back face after
// folding only reads upright on the lanyard when its print is rotated 180°.
export type BadgePanel = { xMm: number; yMm: number; rotated: boolean };

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
    pageWidth: 96.5,
    pageHeight: 134,
    panelWidth: 96.5,
    panelHeight: 134,
    pages: [
      [{ xMm: 0, yMm: 0, rotated: false }],
      [{ xMm: 0, yMm: 0, rotated: true }],
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
};

// Stored designs can predate the current badge model (retired types, removed
// fields). Every consumer of events.badge_design should run it through this.
export function normalizeBadgeDesign(
  stored: Partial<BadgeDesign> | null | undefined,
): BadgeDesign {
  const s = stored ?? {};
  return {
    ...DEFAULT_DESIGN,
    ...s,
    type: DEFAULT_DESIGN.type,
    fields: (s.fields ?? DEFAULT_DESIGN.fields).filter(
      (f): f is BadgeField => ALL_FIELDS.includes(f as BadgeField),
    ),
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

function drawCenteredText(opts: {
  page: ReturnType<PDFDocument["addPage"]>;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  font: PDFFont;
  color: { r: number; g: number; b: number };
}) {
  const { page, text, x, y, maxWidth, fontSize, font, color } = opts;
  if (!text) return;
  const width = font.widthOfTextAtSize(text, fontSize);
  const drawX = x + (maxWidth - width) / 2;
  page.drawText(text, {
    x: drawX,
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
    const ratio = bgImage.image.width / bgImage.image.height;
    const panelRatio = panelW / panelH;
    let w: number, h: number, x: number, y: number;
    if (ratio > panelRatio) {
      h = panelH;
      w = panelH * ratio;
      x = panelX + (panelW - w) / 2;
      y = panelY;
    } else {
      w = panelW;
      h = panelW / ratio;
      x = panelX;
      y = panelY + (panelH - h) / 2;
    }
    page.drawImage(bgImage.image, { x, y, width: w, height: h });
  }

  let cursorY = panelY + panelH - padding;

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
    const logoY = cursorY - logoH;
    page.drawImage(logo.image, {
      x: logoX,
      y: logoY,
      width: logoW,
      height: logoH,
    });
    cursorY = logoY - mmToPt(3);
  }

  const isPrimary = (f: BadgeField) =>
    f === "first_name" || f === "last_name";
  const primaryFields = design.fields.filter(isPrimary);
  const secondaryFields = design.fields.filter((f) => !isPrimary(f));

  const primaryText = primaryFields
    .map((f) => attendeeFieldValue(attendee, f))
    .filter(Boolean)
    .join(" ");

  let drawY = cursorY;
  const maxWidth = panelW - padding * 2;

  if (primaryText) {
    let fontSize = mmToPt(8);
    while (
      boldFont.widthOfTextAtSize(primaryText, fontSize) > maxWidth &&
      fontSize > mmToPt(3)
    ) {
      fontSize -= 1;
    }
    drawY -= fontSize;
    drawCenteredText({
      page,
      text: primaryText,
      x: panelX + padding,
      y: drawY,
      maxWidth,
      fontSize,
      font: boldFont,
      color: fg,
    });
    drawY -= mmToPt(2);
  }

  for (const f of secondaryFields) {
    const text = attendeeFieldValue(attendee, f);
    if (!text) continue;
    const fontSize = mmToPt(3.5);
    drawY -= fontSize;
    if (drawY < panelY + padding) break;
    drawCenteredText({
      page,
      text,
      x: panelX + padding,
      y: drawY,
      maxWidth,
      fontSize,
      font: regularFont,
      color: fg,
    });
    drawY -= mmToPt(1);
  }
}

export async function generateBadgePdf(
  design: BadgeDesign,
  attendees: AttendeeForBadge[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    fetchFontBytes("/fonts/Inter-Regular.woff"),
    fetchFontBytes("/fonts/Inter-Bold.woff"),
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

        if (panel.rotated) {
          page.pushOperators(popGraphicsState());
        }
      }
    }
  }

  return await pdf.save();
}
