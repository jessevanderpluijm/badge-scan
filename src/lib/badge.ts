import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type BadgeType = "butterfly" | "rectangle";
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

export const BADGE_DIMENSIONS_MM: Record<
  BadgeType,
  {
    pageWidth: number;
    pageHeight: number;
    panelWidth: number;
    panelHeight: number;
    panelOffsetsX: number[];
    label: string;
  }
> = {
  butterfly: {
    pageWidth: 96,
    pageHeight: 82,
    panelWidth: 48,
    panelHeight: 82,
    panelOffsetsX: [0, 48],
    label: "Butterfly 96 × 82 mm (2 × 48 mm panels)",
  },
  rectangle: {
    pageWidth: 90,
    pageHeight: 55,
    panelWidth: 90,
    panelHeight: 55,
    panelOffsetsX: [0],
    label: "Rectangle 90 × 55 mm",
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
  type: "butterfly",
  background_color: "#FFFFFF",
  text_color: "#0F172A",
  logo: null,
  background_image: null,
  fields: ["first_name", "last_name", "company", "job_title"],
};

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
  panelW: number;
  panelH: number;
  attendee: AttendeeForBadge;
  design: BadgeDesign;
  bgImage: EmbeddedImage | null;
  logo: EmbeddedImage | null;
  fg: { r: number; g: number; b: number };
  helvetica: PDFFont;
  helveticaBold: PDFFont;
}) {
  const {
    page,
    panelX,
    panelW,
    panelH,
    attendee,
    design,
    bgImage,
    logo,
    fg,
    helvetica,
    helveticaBold,
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
      y = 0;
    } else {
      w = panelW;
      h = panelW / ratio;
      x = panelX;
      y = (panelH - h) / 2;
    }
    page.drawImage(bgImage.image, { x, y, width: w, height: h });
  }

  let cursorY = panelH - padding;

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
      helveticaBold.widthOfTextAtSize(primaryText, fontSize) > maxWidth &&
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
      font: helveticaBold,
      color: fg,
    });
    drawY -= mmToPt(2);
  }

  for (const f of secondaryFields) {
    const text = attendeeFieldValue(attendee, f);
    if (!text) continue;
    const fontSize = mmToPt(3.5);
    drawY -= fontSize;
    if (drawY < padding) break;
    drawCenteredText({
      page,
      text,
      x: panelX + padding,
      y: drawY,
      maxWidth,
      fontSize,
      font: helvetica,
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
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

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
    const page = pdf.addPage([pageW, pageH]);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
      color: rgb(bg.r, bg.g, bg.b),
    });

    for (const offsetMm of dims.panelOffsetsX) {
      drawPanel({
        page,
        panelX: mmToPt(offsetMm),
        panelW,
        panelH,
        attendee,
        design,
        bgImage,
        logo,
        fg,
        helvetica,
        helveticaBold,
      });
    }
  }

  return await pdf.save();
}
