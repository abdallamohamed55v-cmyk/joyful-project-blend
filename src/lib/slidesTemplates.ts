// Templates available in chat-mode slide generation.
// All templates are now "premium" — internal HTML landing-page templates shipped
// from /public/templates/{slug}/index.html. The renderer fetches the template HTML,
// strips nav/header/footer/CTAs, enlarges typography, and injects AI-generated content.

export type SlidesCategory = "premium";

export interface SlidesTemplate {
  id: string;
  name: string;
  description: string;
  /** Two-color hint used for the fallback gradient preview & exported deck palette. */
  colors: [string, string];
  category: SlidesCategory;
  /** Directory under /public/templates/ that contains index.html (+ optional scene.js). */
  htmlSlug: string;
}

/** ─── 20 internal HTML templates with unique, evocative names ─────────── */
export const PREMIUM_HTML_TEMPLATES: SlidesTemplate[] = [
  { id: "premium-vanta-atelier",   name: "Obsidian Atelier",   description: "Editorial dark luxury, gold serif",   colors: ["#0a0a0a", "#c9a84c"], category: "premium", htmlSlug: "remix-vanta-digital-atelier" },
  { id: "premium-verdana-3d",      name: "Verdant Bloom",      description: "Botanical dark, lime accents",        colors: ["#0a0e08", "#a8d63b"], category: "premium", htmlSlug: "remix-3d-website-the-digital-o" },
  { id: "premium-iphone-aura",     name: "Halo Glass",          description: "Frosted glass editorial",             colors: ["#000000", "#7C9AFF"], category: "premium", htmlSlug: "remix-next-generation-iphone" },
  { id: "premium-landscape-napa",  name: "Paper & Ink",         description: "Serif print luxury",                  colors: ["#F5F0E8", "#1a1714"], category: "premium", htmlSlug: "remix-landscape-design" },
  { id: "premium-yash-graphic",    name: "Neon Rose",           description: "Bold pink & purple portfolio",       colors: ["#0e0e10", "#d94f7a"], category: "premium", htmlSlug: "remix-yash-verma-interactive-g" },
  { id: "premium-doc-scriptforge", name: "Field Notes",         description: "Mono editorial documentary",          colors: ["#000000", "#ffffff"], category: "premium", htmlSlug: "remix-documentary-research-and" },
  { id: "premium-ocean-flow",      name: "Deep Current",        description: "Cinematic deep blue",                colors: ["#001f3f", "#5cbdb9"], category: "premium", htmlSlug: "remix-ocean-flow-fish" },
  { id: "premium-splash-genesis",  name: "Emerald Pulse",       description: "Tech dark with emerald glow",         colors: ["#06070d", "#10b981"], category: "premium", htmlSlug: "remix-splash-page-genesis" },
  { id: "premium-ice-fashion",     name: "Crystal Couture",     description: "Glass cubes fashion editorial",       colors: ["#000000", "#e0e7ff"], category: "premium", htmlSlug: "remix-fashion-ice-cubes" },
  { id: "premium-seasonal-flow",   name: "Quiet Seasons",       description: "Light minimal scroll",                colors: ["#fafafa", "#1a1a1a"], category: "premium", htmlSlug: "remix-seasonal-scroll-experien" },
  { id: "premium-bold-3d-typo",    name: "Monolith Type",       description: "Massive sculptural typography",       colors: ["#0a0a0a", "#f5f5f5"], category: "premium", htmlSlug: "remix-bold-3d-typography-portf" },
  { id: "premium-blobs-landing",   name: "Lavender Drift",      description: "Animated blobs, soft gradient",       colors: ["#0e0b1f", "#a78bfa"], category: "premium", htmlSlug: "remix-landing-page-blobs" },
  { id: "premium-tech-consulting", name: "Navy Compass",        description: "Premium B2B navy & white",            colors: ["#0f1b3d", "#e8edf3"], category: "premium", htmlSlug: "remix-premium-tech-consulting" },
  { id: "premium-cosmetic-laundry",name: "Petal Soft",          description: "Pastel cosmetic elegance",            colors: ["#f8e8ee", "#c45c7c"], category: "premium", htmlSlug: "remix-cosmetic-inspired-laundr" },
  { id: "premium-forma-sofa",      name: "Warm Linen",          description: "Editorial product, warm neutrals",    colors: ["#f0ebe3", "#8b7355"], category: "premium", htmlSlug: "remix-forma-ergonomic-sofa" },
  { id: "premium-baresol",         name: "Sage Garden",         description: "Clean wellness, sage & cream",        colors: ["#f5f0e8", "#7d9b76"], category: "premium", htmlSlug: "remix-baresol-skincare" },
  { id: "premium-robotic-tech",    name: "Cyan Circuit",        description: "Futurist electric cyan",              colors: ["#06070d", "#22d3ee"], category: "premium", htmlSlug: "remix-robotic-technologies-202" },
  { id: "premium-ai-video-gen",    name: "Neon Tide",           description: "Vibrant neon gradient hero",          colors: ["#0a0a1a", "#ec4899"], category: "premium", htmlSlug: "remix-ai-video-generator-websi" },
  { id: "premium-silent-wealth",   name: "Quiet Luxury",        description: "Paper, ink, restrained serif",        colors: ["#f5f3ee", "#0d0d0d"], category: "premium", htmlSlug: "remix-silent-wealth" },
  { id: "premium-aiventraq",       name: "Aurora Dark",         description: "Dark with emerald aurora glow",       colors: ["#06070d", "#10b981"], category: "premium", htmlSlug: "remix-aiventraq-ai-automation" },
];

export const SLIDES_TEMPLATES: SlidesTemplate[] = [...PREMIUM_HTML_TEMPLATES];

export const DEFAULT_SLIDES_TEMPLATE = "premium-vanta-atelier";

export function findSlidesTemplate(id?: string | null): SlidesTemplate {
  return SLIDES_TEMPLATES.find((t) => t.id === id) || PREMIUM_HTML_TEMPLATES[0];
}

export function isPremiumHtml(id?: string | null): boolean {
  const t = SLIDES_TEMPLATES.find((x) => x.id === id);
  return !!(t && t.htmlSlug);
}
