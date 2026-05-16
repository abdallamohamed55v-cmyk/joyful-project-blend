// Templates available in chat-mode slide generation.
// "premium" = internal HTML landing-page templates we ship from /public/templates/{slug}/index.html.
//   Renderer fetches the template HTML, strips nav/header/footer/CTAs, enlarges typography,
//   and injects AI-generated content (titles, paragraphs, images).

export type SlidesCategory = "premium";

export interface SlidesTemplate {
  id: string;
  name: string;
  description: string;
  /** Two-color hint used for the fallback gradient preview & exported deck palette. */
  colors: [string, string];
  category: SlidesCategory;
  /** For premium: directory under /public/templates/ that contains index.html (+ optional scene.js). */
  htmlSlug?: string;
}

/** ─── Premium: 10 internal HTML landing-page templates ─────────────────── */
export const PREMIUM_HTML_TEMPLATES: SlidesTemplate[] = [
  { id: "premium-vanta-atelier",   name: "Vanta Atelier",     description: "Editorial dark luxury, gold serif",   colors: ["#0a0a0a", "#c9a84c"], category: "premium", htmlSlug: "remix-vanta-digital-atelier" },
  { id: "premium-verdana-3d",      name: "Verdana 3D",        description: "Botanical dark, lime three.js",       colors: ["#0a0e08", "#a8d63b"], category: "premium", htmlSlug: "remix-3d-website-the-digital-o" },
  { id: "premium-iphone-aura",     name: "iPhone Aura",        description: "Apple-style frosted glass editorial", colors: ["#000000", "#7C9AFF"], category: "premium", htmlSlug: "remix-next-generation-iphone" },
  { id: "premium-landscape-napa",  name: "Landscape Atelier",  description: "Paper & ink, serif print luxury",     colors: ["#F5F0E8", "#1a1714"], category: "premium", htmlSlug: "remix-landscape-design" },
  { id: "premium-yash-graphic",    name: "Yash Graphic",       description: "Bold pink/purple designer portfolio", colors: ["#0e0e10", "#d94f7a"], category: "premium", htmlSlug: "remix-yash-verma-interactive-g" },
  { id: "premium-doc-scriptforge", name: "ScriptForge Doc",    description: "Documentary research mono editorial", colors: ["#000000", "#ffffff"], category: "premium", htmlSlug: "remix-documentary-research-and" },
  { id: "premium-ocean-flow",      name: "Ocean Flow",         description: "Deep blue cinematic, fish boids",     colors: ["#001f3f", "#5cbdb9"], category: "premium", htmlSlug: "remix-ocean-flow-fish" },
  { id: "premium-splash-genesis",  name: "Splash Genesis",     description: "Tech dark, emerald + Rajdhani",       colors: ["#06070d", "#10b981"], category: "premium", htmlSlug: "remix-splash-page-genesis" },
  { id: "premium-ice-fashion",     name: "Fashion Ice",        description: "Glass cubes, fashion editorial",      colors: ["#000000", "#e0e7ff"], category: "premium", htmlSlug: "remix-fashion-ice-cubes" },
  { id: "premium-seasonal-flow",   name: "Seasonal Flow",      description: "Light minimal, four seasons scroll",   colors: ["#fafafa", "#1a1a1a"], category: "premium", htmlSlug: "remix-seasonal-scroll-experien" },
  { id: "premium-bold-3d-typo",    name: "Bold 3D Typography", description: "Massive 3D type, designer portfolio",  colors: ["#0a0a0a", "#f5f5f5"], category: "premium", htmlSlug: "remix-bold-3d-typography-portf" },
  { id: "premium-blobs-landing",   name: "Liquid Blobs",       description: "Animated blobs, soft gradient hero",   colors: ["#0e0b1f", "#a78bfa"], category: "premium", htmlSlug: "remix-landing-page-blobs" },
  { id: "premium-tech-consulting", name: "Tech Consulting",    description: "Premium B2B, navy + crisp white",      colors: ["#0f1b3d", "#e8edf3"], category: "premium", htmlSlug: "remix-premium-tech-consulting" },
  { id: "premium-cosmetic-laundry",name: "Cosmetic Laundry",   description: "Pastel cosmetic, soft serif elegance", colors: ["#f8e8ee", "#c45c7c"], category: "premium", htmlSlug: "remix-cosmetic-inspired-laundr" },
  { id: "premium-forma-sofa",      name: "Forma Ergonomic",    description: "Editorial product, warm neutrals",     colors: ["#f0ebe3", "#8b7355"], category: "premium", htmlSlug: "remix-forma-ergonomic-sofa" },
  { id: "premium-baresol",         name: "Baresol Skincare",   description: "Clean skincare, sage + cream",         colors: ["#f5f0e8", "#7d9b76"], category: "premium", htmlSlug: "remix-baresol-skincare" },
  { id: "premium-robotic-tech",    name: "Robotic Tech 2025",  description: "Futurist robotics, electric cyan",     colors: ["#06070d", "#22d3ee"], category: "premium", htmlSlug: "remix-robotic-technologies-202" },
  { id: "premium-ai-video-gen",    name: "AI Video Studio",    description: "AI generator, neon gradient hero",     colors: ["#0a0a1a", "#ec4899"], category: "premium", htmlSlug: "remix-ai-video-generator-websi" },
  { id: "premium-silent-wealth",   name: "Silent Wealth",      description: "Quiet luxury, paper + ink serif",      colors: ["#f5f3ee", "#0d0d0d"], category: "premium", htmlSlug: "remix-silent-wealth" },
  { id: "premium-aiventraq",       name: "Aiventraq Automation",description: "AI automation, dark + emerald glow",  colors: ["#06070d", "#10b981"], category: "premium", htmlSlug: "remix-aiventraq-ai-automation" },
];

/** Megsy Illustrated Deck — internal multi-slide deck inspired by the
 *  Modern Illustrated Critical Thinking design (beige #E5DACF, black, Mali + Rubik). */
export const MEGSY_DECK_TEMPLATES: SlidesTemplate[] = [
  {
    id: "premium-megsy-illustrated",
    name: "Megsy Illustrated",
    description: "Beige + black, illustrated characters, Mali serif headlines",
    colors: ["#E5DACF", "#000000"],
    category: "premium",
    htmlSlug: "megsy-illustrated-deck",
  },
  {
    id: "premium-odyssey-classical",
    name: "Odyssey Classical",
    description: "Parchment + teal + terracotta, Cormorant serif, Greek-key motifs",
    colors: ["#f0e6d2", "#1d4a52"],
    category: "premium",
    htmlSlug: "odyssey-classical-deck",
  },
];

export const SLIDES_TEMPLATES: SlidesTemplate[] = [
  ...MEGSY_DECK_TEMPLATES,
  ...PREMIUM_HTML_TEMPLATES,
];

export const DEFAULT_SLIDES_TEMPLATE = "premium-megsy-illustrated";

export function findSlidesTemplate(id?: string | null): SlidesTemplate {
  return SLIDES_TEMPLATES.find((t) => t.id === id) || PREMIUM_HTML_TEMPLATES[0];
}

export function isPremiumHtml(id?: string | null): boolean {
  const t = SLIDES_TEMPLATES.find((x) => x.id === id);
  return !!(t && t.category === "premium" && t.htmlSlug);
}
