// Orchestrates the @docs agent: ask the existing builder-schema edge function
// for a structured document plan (reusing the deployed function to avoid the
// edge-function quota), build the chosen file format on the client, upload
// the artifact, and return a card-ready payload.

import { generateBuilderSchema } from "@/lib/builders/aiSchema";
import { uploadArtifact } from "@/lib/builders/aiSchema";
import { buildDocsArtifact, type DocPlan, type DocsFormat } from "./generators";
import type { DocsTemplate } from "./templates";
import type { DocumentSchema } from "@/lib/builders/types";

export interface DocsRunResult {
  ok: boolean;
  title?: string;
  summary?: string;
  downloadUrl?: string;
  mime?: string;
  format?: DocsFormat;
  templateLabel?: string;
  error?: string;
}

export async function runDocsAgent(params: {
  prompt: string;
  template: DocsTemplate;
  format?: DocsFormat;
  language?: string;
}): Promise<DocsRunResult> {
  const format = params.format ?? params.template.defaultFormat;

  try {
    // Reuse generate-builder-schema (already deployed) by passing the template's
    // system prompt as extra context so the model frames the document properly.
    const blueprint = params.template.sectionBlueprint
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n");
    const briefText = [
      `Template: ${params.template.labelEn} (${params.template.id})`,
      `Role & Instructions: ${params.template.systemPrompt}`,
      `Target format: ${format.toUpperCase()}.`,
      `Required sections (use these exact headings, in order, none skipped):`,
      blueprint,
      params.template.structureNotes ? `Structure notes: ${params.template.structureNotes}` : "",
      `Each section body MUST be 2-5 well-developed paragraphs. Use lines starting with "- " for bullet points where appropriate.`,
    ].filter(Boolean).join("\n");

    const schema = await generateBuilderSchema<DocumentSchema>("document", params.prompt, {
      brief: briefText,
      userLanguage: params.language,
    });
    if (!schema) return { ok: false, error: "no_doc_returned" };

    const plan: DocPlan = {
      title: schema.title,
      subtitle: schema.subtitle,
      language: schema.language,
      sections: (schema.sections || []).map((s) => {
        // Extract bullet lines ("- " or "• ") out of the body into bullets[].
        const lines = (s.body || "").split(/\r?\n/);
        const bullets: string[] = [];
        const bodyLines: string[] = [];
        for (const ln of lines) {
          const m = ln.match(/^\s*(?:[-•*]|\d+\.)\s+(.+)$/);
          if (m) bullets.push(m[1].trim());
          else bodyLines.push(ln);
        }
        return {
          heading: s.heading,
          body: bodyLines.join("\n").trim(),
          bullets: bullets.length ? bullets : undefined,
        };
      }),
    };

    const { blob, ext, mime } = await buildDocsArtifact(plan, format);
    const safe = (plan.title || "document").replace(/[^a-z0-9-_ \u0600-\u06FF]/gi, "_").slice(0, 60);
    const url = await uploadArtifact(blob, `${safe}.${ext}`, "books");

    return {
      ok: true,
      title: plan.title,
      summary: plan.subtitle || `${plan.sections?.length ?? 0} sections`,
      downloadUrl: url ?? undefined,
      mime,
      format,
      templateLabel: params.template.label,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
