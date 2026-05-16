// Template catalog for the @docs agent.
// Inspired by Kimi Docs, with two extra original templates.

import {
  FileSearch, Languages, Layout, FileBarChart2, Scale,
  Calculator, GraduationCap, Gavel,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DocsFormat = "docx" | "pdf" | "md";

export interface DocsTemplate {
  id: string;
  label: string;            // Arabic label
  labelEn: string;          // English fallback
  description: string;      // Arabic
  icon: LucideIcon;
  color: string;            // tailwind text color
  bg: string;               // tailwind bg color
  formats: DocsFormat[];    // supported output formats
  defaultFormat: DocsFormat;
  cost: number;             // MC
  systemPrompt: string;     // sent to the model
  /** Ordered list of section headings (or heading hints) the model MUST produce. */
  sectionBlueprint: string[];
  /** Extra structural instructions passed to the model. */
  structureNotes?: string;
}

export const DOCS_TEMPLATES: DocsTemplate[] = [
  {
    id: "review-expert",
    label: "خبير المراجعة",
    labelEn: "Review Expert",
    description: "مراجعة احترافية للمستندات مع تعليقات وتصحيحات",
    icon: FileSearch,
    color: "text-sky-500",
    bg: "bg-sky-500/15",
    formats: ["docx", "pdf", "md"],
    defaultFormat: "docx",
    cost: 5,
    systemPrompt:
      "You are a professional document reviewer. Analyze the user's document, point out structural, grammatical and stylistic issues, and suggest specific edits with inline comments.",
    sectionBlueprint: [
      "Overview & Document Summary",
      "Structural Issues",
      "Grammar & Style Issues",
      "Suggested Edits (clause by clause)",
      "Overall Recommendation",
    ],
    structureNotes: "Use bullet lists under each section. Cite quoted phrases when flagging issues.",
  },
  {
    id: "translation",
    label: "ترجمة احترافية",
    labelEn: "Professional Translation",
    description: "ترجمة الملفات مع الحفاظ على التنسيق والمعادلات",
    icon: Languages,
    color: "text-emerald-500",
    bg: "bg-emerald-500/15",
    formats: ["pdf", "docx", "md"],
    defaultFormat: "pdf",
    cost: 5,
    systemPrompt:
      "You are a professional translator. Preserve the document's structure, formatting, equations and tables while producing a fluent, accurate translation.",
    sectionBlueprint: [
      "Translation Brief (source/target language, audience, tone)",
      "Glossary of Key Terms",
      "Translated Content",
      "Translator Notes",
    ],
    structureNotes: "Mirror source headings inside 'Translated Content'. Keep equations/code verbatim.",
  },
  {
    id: "pdf-design",
    label: "تصميم ونشر PDF",
    labelEn: "PDF Design & Publishing",
    description: "كتالوجات ومحافظ أعمال جاهزة للنشر",
    icon: Layout,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/15",
    formats: ["pdf"],
    defaultFormat: "pdf",
    cost: 5,
    systemPrompt:
      "You are a layout designer. Produce a catalog/portfolio styled PDF with clean typography, hero sections and consistent spacing.",
    sectionBlueprint: [
      "Cover Page (brand statement)",
      "About / Introduction",
      "Featured Items / Projects",
      "Detailed Catalog",
      "Contact & Call to Action",
    ],
    structureNotes: "Each catalog item: name, one-line tagline, description, key specs as bullets.",
  },
  {
    id: "professional-report",
    label: "تقرير احترافي",
    labelEn: "Professional Report",
    description: "تقارير طويلة بأسلوب ماكنزي وملخصات تنفيذية",
    icon: FileBarChart2,
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    formats: ["docx", "pdf"],
    defaultFormat: "docx",
    cost: 5,
    systemPrompt:
      "You are a McKinsey-grade consultant. Produce a structured long-form report: executive summary, situation, complication, resolution, KPIs and recommendations.",
    sectionBlueprint: [
      "Executive Summary",
      "Context & Situation",
      "Key Findings",
      "Analysis & Insights",
      "KPIs & Metrics",
      "Recommendations",
      "Next Steps & Roadmap",
    ],
    structureNotes: "Use SCR (Situation-Complication-Resolution). Quantify wherever possible.",
  },
  {
    id: "contract-review",
    label: "مراجعة العقود",
    labelEn: "Contract Review",
    description: "تحليل قانوني للعقود مع تنبيهات للمخاطر",
    icon: Scale,
    color: "text-rose-500",
    bg: "bg-rose-500/15",
    formats: ["docx", "pdf"],
    defaultFormat: "docx",
    cost: 5,
    systemPrompt:
      "You are a contract attorney. Review the provided contract clause by clause, flag risky language, and suggest safer alternatives in a comments section.",
    sectionBlueprint: [
      "Contract Overview (parties, scope, duration)",
      "Clause-by-Clause Review",
      "Risk Register (High / Medium / Low)",
      "Suggested Redlines",
      "Final Recommendation",
    ],
    structureNotes: "Under 'Risk Register' use bullets prefixed with [HIGH]/[MED]/[LOW].",
  },
  {
    id: "financial-modeling",
    label: "نمذجة مالية",
    labelEn: "Financial Modeling",
    description: "نماذج مالية مبسطة وتقارير Word",
    icon: Calculator,
    color: "text-green-500",
    bg: "bg-green-500/15",
    formats: ["docx"],
    defaultFormat: "docx",
    cost: 5,
    systemPrompt:
      "You are a financial analyst. Build a simple 3-statement model summary, assumptions table and a narrative analysis in a Word document.",
    sectionBlueprint: [
      "Business Overview",
      "Key Assumptions",
      "Revenue Model",
      "P&L Summary (3 years)",
      "Cash Flow & Funding Needs",
      "Sensitivity & Risks",
      "Conclusion",
    ],
    structureNotes: "Express numbers in tables drawn as bullet rows when needed.",
  },
  // Two extras not in Kimi:
  {
    id: "academic-paper",
    label: "ورقة بحثية",
    labelEn: "Academic Paper",
    description: "أبحاث بصيغة APA / IEEE / MLA مع مراجع",
    icon: GraduationCap,
    color: "text-indigo-500",
    bg: "bg-indigo-500/15",
    formats: ["docx", "pdf"],
    defaultFormat: "docx",
    cost: 5,
    systemPrompt:
      "You are an academic writer. Produce a paper with abstract, introduction, methodology, results, discussion and references in APA style by default.",
    sectionBlueprint: [
      "Abstract",
      "Keywords",
      "Introduction",
      "Literature Review",
      "Methodology",
      "Results",
      "Discussion",
      "Conclusion",
      "References (APA)",
    ],
    structureNotes: "Use formal academic tone. Inline citations as (Author, Year).",
  },
  {
    id: "legal-doc",
    label: "مستندات قانونية",
    labelEn: "Legal Document Generator",
    description: "عقود، وكالات، إنذارات وشكاوى جاهزة",
    icon: Gavel,
    color: "text-orange-500",
    bg: "bg-orange-500/15",
    formats: ["docx", "pdf"],
    defaultFormat: "docx",
    cost: 5,
    systemPrompt:
      "You are a legal draftsman. Produce a formal legal document (contract, power of attorney, warning letter, complaint) using standard clauses for the jurisdiction the user specifies.",
    sectionBlueprint: [
      "Document Header (type, date, place)",
      "Parties / Signatories",
      "Preamble / Whereas Clauses",
      "Articles / Terms",
      "Obligations of Each Party",
      "Termination & Dispute Resolution",
      "Signatures",
    ],
    structureNotes: "Number articles (المادة الأولى/Article 1...). Use formal legal register.",
  },
];

export const getDocsTemplate = (id: string) =>
  DOCS_TEMPLATES.find((t) => t.id === id);
