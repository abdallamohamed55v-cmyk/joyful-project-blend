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

/** ─── Premium: internal HTML landing-page templates ─────────────────────── */
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
  { id: "premium-3d-car-scroll",    name: "3D Car Scroll",      description: "Cinematic automotive scroll, chrome black", colors: ["#050505", "#d9d9d9"], category: "premium", htmlSlug: "remix-3d-car-scroll-website" },
  { id: "premium-3d-portfolio-builder", name: "3D Portfolio Builder", description: "Immersive portfolio builder, neon depth", colors: ["#080816", "#60a5fa"], category: "premium", htmlSlug: "remix-3d-portfolio-website-bui" },
  { id: "premium-vinyl-camera",     name: "Vinyl Camera",       description: "Analog vinyl mood, camera-ref motion", colors: ["#111111", "#f59e0b"], category: "premium", htmlSlug: "remix-3d-vinyl-with-camera-ref" },
  { id: "premium-ai-builder",       name: "AI Website Builder",  description: "Unlimited AI builder SaaS hero", colors: ["#0a0a1a", "#38bdf8"], category: "premium", htmlSlug: "remix-ai-website-builder-unlim" },
  { id: "premium-graphic-designer", name: "Graphic Designer",    description: "Animated creative portfolio, bold color", colors: ["#111827", "#fb7185"], category: "premium", htmlSlug: "remix-animated-graphic-designer" },
  { id: "premium-water-circle",     name: "Water Circle",       description: "3D water circle, liquid blue motion", colors: ["#06213a", "#67e8f9"], category: "premium", htmlSlug: "remix-circle-of-water-3d-websi" },
  { id: "premium-comic-hero",       name: "Comic Hero",         description: "Comic-inspired cinematic web poster", colors: ["#0b1020", "#ef4444"], category: "premium", htmlSlug: "remix-cool-spiderman-website" },
  { id: "premium-flavora",          name: "Flavora Meal",       description: "Interactive food landing, fresh and warm", colors: ["#18230f", "#f97316"], category: "premium", htmlSlug: "remix-flavora-interactive-meal" },
  { id: "premium-game-launch",      name: "Game Launch",        description: "High-energy gaming page, neon action", colors: ["#09090b", "#a855f7"], category: "premium", htmlSlug: "remix-game-landing-page-design" },
  { id: "premium-digital-marketplace", name: "Digital Marketplace", description: "Interactive 3D marketplace, cyber commerce", colors: ["#050816", "#22d3ee"], category: "premium", htmlSlug: "remix-interactive-3d-digital-m" },
  { id: "premium-helmet-showcase",  name: "Helmet Showcase",    description: "Interactive 3D product helmet showcase", colors: ["#0f172a", "#facc15"], category: "premium", htmlSlug: "remix-interactive-3d-helmet-sh" },
  { id: "premium-portfolio-3d",     name: "Portfolio 3D",       description: "Interactive 3D personal portfolio", colors: ["#020617", "#2dd4bf"], category: "premium", htmlSlug: "remix-interactive-3d-portfolio" },
  { id: "premium-logic-cube",       name: "Logic Cube",         description: "Floating cube, abstract tech geometry", colors: ["#0b0b12", "#f8fafc"], category: "premium", htmlSlug: "remix-logic-cube-floating" },
  { id: "premium-modern-ai-visible", name: "Modern AI Visible", description: "Modern AI brand, clean luminous sections", colors: ["#f8fafc", "#2563eb"], category: "premium", htmlSlug: "remix-modern-ai-visible-websit" },
  { id: "premium-neon-portfolio",   name: "Neon Portfolio",     description: "Neon UI designer portfolio, dark glow", colors: ["#050505", "#39ff14"], category: "premium", htmlSlug: "remix-neon-portfolio-for-ui-de" },
  { id: "premium-noodles",          name: "Noodles Splash",     description: "Playful noodles splash page, vivid food", colors: ["#fef3c7", "#ef4444"], category: "premium", htmlSlug: "remix-noodles-splash-page" },
  { id: "premium-buoy-data",        name: "Ocean Buoy Data",    description: "Real-time ocean buoy dashboard aesthetic", colors: ["#0c2340", "#5cbdb9"], category: "premium", htmlSlug: "remix-real-time-ocean-buoy-dat" },
  { id: "premium-abstract-vector",  name: "Abstract Vector",    description: "Abstract vector neon design system", colors: ["#0b1020", "#e879f9"], category: "premium", htmlSlug: "remix-remix-abstract-vector-ne" },
  { id: "premium-science-lab",      name: "Science Lab",        description: "Interactive science lab, bright discovery", colors: ["#061626", "#84cc16"], category: "premium", htmlSlug: "remix-science-lab-website-with" },
  { id: "premium-velammal",         name: "Velammal",           description: "Institutional editorial engineering site", colors: ["#0f1b3d", "#e8edf3"], category: "premium", htmlSlug: "remix-velammal-engineering-col" },
  { id: "premium-veloured",         name: "Veloured",           description: "Premium modern minimal landing page", colors: ["#f5f3ee", "#111111"], category: "premium", htmlSlug: "remix-veloured-modern-landing-" },
  { id: "premium-voxel",            name: "Voxel Website",      description: "Voxel-inspired playful 3D website", colors: ["#101828", "#f97316"], category: "premium", htmlSlug: "remix-voxel-website" },
  { id: "premium-vary-noodles",     name: "Noodles Variant",    description: "Alternate playful noodles splash layout", colors: ["#fff7ed", "#fb923c"], category: "premium", htmlSlug: "vary-noodles-splash-page" },
];

/** Megsy Deck — flagship template that mirrors the megsy.ai landing page
 *  (pitch-black bg, electric purple primary, Space Grotesk display). */
export const MEGSY_DECK_TEMPLATES: SlidesTemplate[] = [
  {
    id: "premium-megsy-landing",
    name: "Megsy",
    description: "Pitch black + electric purple, Space Grotesk — landing-page look",
    colors: ["#000000", "#8b5cf6"],
    category: "premium",
    htmlSlug: "megsy-landing-deck",
  },
];

export const SLIDES_TEMPLATES: SlidesTemplate[] = [
  ...MEGSY_DECK_TEMPLATES,
  ...PREMIUM_HTML_TEMPLATES,
];

export const DEFAULT_SLIDES_TEMPLATE = "premium-megsy-landing";

export function findSlidesTemplate(id?: string | null): SlidesTemplate {
  return SLIDES_TEMPLATES.find((t) => t.id === id) || PREMIUM_HTML_TEMPLATES[0];
}

export function isPremiumHtml(id?: string | null): boolean {
  const t = SLIDES_TEMPLATES.find((x) => x.id === id);
  return !!(t && t.category === "premium" && t.htmlSlug);
}
