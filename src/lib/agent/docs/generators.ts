// Client-side document generators for the @docs agent.
// Builds DOCX (via `docx`), PDF (via `pdf-lib`), or Markdown blobs
// from a structured DocPlan returned by the docs-generate edge function.

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface DocSection {
  heading: string;
  body: string;
  bullets?: string[];
  level?: number;
}

export interface DocPlan {
  title: string;
  subtitle?: string;
  language?: string;
  sections: DocSection[];
}

export type DocsFormat = "docx" | "pdf" | "md";

const detectRtl = (plan: DocPlan): boolean => {
  const sample = `${plan.title} ${plan.subtitle ?? ""} ${plan.sections[0]?.body ?? ""}`;
  return /[\u0600-\u06FF]/.test(sample);
};

// ───────────── DOCX ─────────────
export async function buildDocxBlob(plan: DocPlan): Promise<Blob> {
  const rtl = detectRtl(plan);

  const children: Paragraph[] = [];
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
      bidirectional: rtl,
      children: [new TextRun({ text: plan.title, bold: true, size: 44, rightToLeft: rtl })],
    }),
  );
  if (plan.subtitle) {
    children.push(
      new Paragraph({
        alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: rtl,
        children: [new TextRun({ text: plan.subtitle, italics: true, size: 24, color: "555555", rightToLeft: rtl })],
        spacing: { after: 240 },
      }),
    );
  }

  for (const s of plan.sections) {
    const level = s.level === 3 ? HeadingLevel.HEADING_3 : s.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1;
    children.push(
      new Paragraph({
        heading: level,
        alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: rtl,
        children: [new TextRun({ text: s.heading, bold: true, rightToLeft: rtl })],
        spacing: { before: 240, after: 120 },
      }),
    );
    const bodyParas = s.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (const p of bodyParas) {
      children.push(
        new Paragraph({
          alignment: rtl ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
          bidirectional: rtl,
          children: [new TextRun({ text: p, size: 24, rightToLeft: rtl })],
          spacing: { after: 120, line: 360 },
        }),
      );
    }
    if (s.bullets?.length) {
      for (const b of s.bullets) {
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: rtl,
            children: [new TextRun({ text: b, size: 24, rightToLeft: rtl })],
          }),
        );
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    styles: {
      default: { document: { run: { font: rtl ? "Arial" : "Calibri", size: 24 } } },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

// ───────────── PDF ─────────────
// Note: pdf-lib's built-in fonts don't support Arabic glyphs. For Arabic
// content we fall back to DOCX-style instructions for now and the PDF will
// render Latin text only. Full Arabic PDF support comes in a later phase
// (custom font embedding).
export async function buildPdfBlob(plan: DocPlan): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const margin = 56;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const wrap = (text: string, f: typeof font, size: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxWidth) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const draw = (text: string, opts: { f: typeof font; size: number; color?: [number, number, number]; gapAfter?: number }) => {
    const lines = wrap(text, opts.f, opts.size);
    for (const ln of lines) {
      if (y - opts.size < margin) newPage();
      page.drawText(ln, {
        x: margin,
        y: y - opts.size,
        size: opts.size,
        font: opts.f,
        color: opts.color ? rgb(...opts.color) : rgb(0.1, 0.1, 0.12),
      });
      y -= opts.size * 1.4;
    }
    y -= opts.gapAfter ?? 4;
  };

  // Title
  draw(plan.title, { f: bold, size: 24, gapAfter: 8 });
  if (plan.subtitle) draw(plan.subtitle, { f: italic, size: 13, color: [0.35, 0.35, 0.4], gapAfter: 16 });

  for (const s of plan.sections) {
    if (y < margin + 80) newPage();
    draw(s.heading, { f: bold, size: 15, gapAfter: 6 });
    const paras = s.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (const p of paras) draw(p, { f: font, size: 11, gapAfter: 6 });
    if (s.bullets?.length) {
      for (const b of s.bullets) draw(`• ${b}`, { f: font, size: 11, gapAfter: 2 });
    }
    y -= 6;
  }

  const bytes = await pdf.save();
  return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: "application/pdf" });
}

// ───────────── Markdown ─────────────
export function buildMarkdownBlob(plan: DocPlan): Blob {
  const lines: string[] = [];
  lines.push(`# ${plan.title}`);
  if (plan.subtitle) lines.push(`\n_${plan.subtitle}_\n`);
  for (const s of plan.sections) {
    const hashes = "#".repeat(Math.min(3, Math.max(2, s.level ?? 2)));
    lines.push(`\n${hashes} ${s.heading}\n`);
    lines.push(s.body);
    if (s.bullets?.length) {
      lines.push("");
      for (const b of s.bullets) lines.push(`- ${b}`);
    }
  }
  return new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
}

export async function buildDocsArtifact(plan: DocPlan, format: DocsFormat): Promise<{ blob: Blob; ext: string; mime: string }> {
  if (format === "docx") {
    return { blob: await buildDocxBlob(plan), ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  }
  if (format === "pdf") {
    return { blob: await buildPdfBlob(plan), ext: "pdf", mime: "application/pdf" };
  }
  return { blob: buildMarkdownBlob(plan), ext: "md", mime: "text/markdown" };
}
