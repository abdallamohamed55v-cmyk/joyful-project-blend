// Template catalog for the @docs agent.
// Inspired by Kimi Docs, with two extra original templates.

import {
  FileSearch, Languages, Layout, FileBarChart2, Scale,
  Calculator, GraduationCap, Gavel,
  BookOpen, Code2, Sparkles, Compass, Terminal, Globe,
  Library, Lightbulb, Map, Notebook,
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

  // ───────────── Internally curated templates inspired by 2026 OSS docs frameworks ─────────────
  {
    id: "atrium-codex",
    label: "أتريوم للمطورين",
    labelEn: "Atrium Codex",
    description: "وثائق تقنية بأسلوب MDX منظم، مع أمثلة كود ومسارات تعلم",
    icon: Code2,
    color: "text-violet-500",
    bg: "bg-violet-500/15",
    formats: ["md", "pdf", "docx"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are a senior developer-relations writer. Produce technical documentation in a clean MDX-friendly tone: short intros, code-first examples, and well-scoped pages.",
    sectionBlueprint: [
      "Overview",
      "Quick Start",
      "Core Concepts",
      "API Reference",
      "Examples",
      "Troubleshooting",
      "Next Steps",
    ],
    structureNotes: "Wrap code samples in fenced ``` blocks. Use short paragraphs.",
  },
  {
    id: "polaris-notes",
    label: "بولاريس الواضحة",
    labelEn: "Polaris Notes",
    description: "وثائق مشروع نظيفة، نبرة هادئة وتنقل واضح",
    icon: Compass,
    color: "text-sky-500",
    bg: "bg-sky-500/15",
    formats: ["md", "pdf"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are a documentation writer focused on clarity. Produce a friendly, accessible docs page with a clear narrative and minimal jargon.",
    sectionBlueprint: [
      "Introduction",
      "Getting Started",
      "Guides",
      "Configuration",
      "FAQ",
    ],
  },
  {
    id: "tide-manual",
    label: "دليل المد",
    labelEn: "Tide Manual",
    description: "دليل منتج بأسلوب SaaS لامع — مقاطع بطاقات وتدفقات",
    icon: Sparkles,
    color: "text-cyan-500",
    bg: "bg-cyan-500/15",
    formats: ["pdf", "md"],
    defaultFormat: "pdf",
    cost: 5,
    systemPrompt:
      "You are a SaaS docs designer. Produce a polished product manual with hero intro, feature cards, step-by-step flows and pro tips.",
    sectionBlueprint: [
      "Welcome",
      "Key Features",
      "Step-by-Step Walkthrough",
      "Best Practices",
      "Pro Tips",
      "Support",
    ],
    structureNotes: "Lead each feature with a one-line tagline before the body.",
  },
  {
    id: "pillar-library",
    label: "مكتبة الأعمدة",
    labelEn: "Pillar Library",
    description: "موسوعة بأسلوب موقع مرجعي — أقسام كثيفة ومراجع متبادلة",
    icon: Library,
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    formats: ["md", "pdf", "docx"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are a reference-site editor. Produce a deep, encyclopedic article with hierarchical headings and explicit cross-references.",
    sectionBlueprint: [
      "Definition",
      "History & Background",
      "Core Components",
      "How It Works",
      "Variants",
      "Common Pitfalls",
      "See Also",
    ],
  },
  {
    id: "verdant-handbook",
    label: "كتيب فيردانت",
    labelEn: "Verdant Handbook",
    description: "كتيب فريق تعاوني بأسلوب ويكي — أدوار، إجراءات، قرارات",
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/15",
    formats: ["md", "docx", "pdf"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are an internal-knowledge editor. Produce a team handbook with roles, processes, decision logs and onboarding notes.",
    sectionBlueprint: [
      "Mission & Values",
      "Team Structure",
      "Workflows & Processes",
      "Standards",
      "Decisions Log",
      "Onboarding Checklist",
    ],
  },
  {
    id: "sapling-api",
    label: "مرجع واجهات سابلينج",
    labelEn: "Sapling API Reference",
    description: "مرجع واجهات API منظم بنبرة هندسية واضحة",
    icon: Terminal,
    color: "text-emerald-500",
    bg: "bg-emerald-500/15",
    formats: ["md", "pdf"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are an API technical writer. Produce a structured API reference: per-endpoint description, parameters, request and response examples.",
    sectionBlueprint: [
      "Overview",
      "Authentication",
      "Endpoints",
      "Request & Response Examples",
      "Error Codes",
      "Rate Limits",
      "Changelog",
    ],
    structureNotes: "Under 'Endpoints', list each as: METHOD /path — purpose. Use bullets for parameters.",
  },
  {
    id: "carrara-reference",
    label: "كرارا المرجعية",
    labelEn: "Carrara Reference",
    description: "مرجع API فاخر بأسلوب OpenAPI وعروض أمثلة",
    icon: Globe,
    color: "text-indigo-500",
    bg: "bg-indigo-500/15",
    formats: ["pdf", "md"],
    defaultFormat: "pdf",
    cost: 5,
    systemPrompt:
      "You are a senior API designer. Produce a premium, OpenAPI-style reference with rich examples and security notes.",
    sectionBlueprint: [
      "Introduction",
      "Servers & Environments",
      "Authentication & Security",
      "Resources",
      "Endpoint Catalog",
      "Schemas",
      "Webhooks",
    ],
  },
  {
    id: "crescent-pages",
    label: "صفحات الهلال",
    labelEn: "Crescent Pages",
    description: "مقالات قصيرة وأنيقة بأسلوب MDX خفيف",
    icon: Notebook,
    color: "text-rose-500",
    bg: "bg-rose-500/15",
    formats: ["md", "pdf"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are a docs author who values brevity. Produce a short MDX-style page with a strong opening line and crisp sections.",
    sectionBlueprint: [
      "TL;DR",
      "Why It Matters",
      "How to Use",
      "Examples",
      "Wrap-Up",
    ],
  },
  {
    id: "atlas-workspace",
    label: "أطلس مساحة العمل",
    labelEn: "Atlas Workspace",
    description: "صفحة معرفة تعاونية بأسلوب الورقة الواحدة",
    icon: Map,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/15",
    formats: ["md", "docx"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are a knowledge-base writer. Produce a single-page workspace document combining context, plan, action items and references.",
    sectionBlueprint: [
      "Context",
      "Goals",
      "Plan & Milestones",
      "Action Items",
      "Owners & Dates",
      "References",
    ],
  },
  {
    id: "spectra-runbook",
    label: "دليل سبكترا التشغيلي",
    labelEn: "Spectra Runbook",
    description: "دليل تشغيلي للحوادث والإجراءات الجاهزة",
    icon: Lightbulb,
    color: "text-orange-500",
    bg: "bg-orange-500/15",
    formats: ["md", "pdf", "docx"],
    defaultFormat: "md",
    cost: 5,
    systemPrompt:
      "You are an SRE writer. Produce a runbook with incident triage steps, diagnostics, and rollback procedures.",
    sectionBlueprint: [
      "Service Overview",
      "Common Alerts",
      "Diagnostics",
      "Mitigation Steps",
      "Rollback Procedure",
      "Postmortem Template",
    ],
    structureNotes: "Use numbered steps inside diagnostics and mitigation.",
  },
];

export const getDocsTemplate = (id: string) =>
  DOCS_TEMPLATES.find((t) => t.id === id);

export const findDocsTemplate = (id?: string | null) =>
  (id && DOCS_TEMPLATES.find((t) => t.id === id)) || DOCS_TEMPLATES[0];
