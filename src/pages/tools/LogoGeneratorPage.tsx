import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import logoHero from "@/assets/logo-generator-hero.jpg";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const STYLES: { id: string; label: string; desc: string; prompt: string }[] = [
  { id: "minimal", label: "Minimal", desc: "Clean & simple", prompt: "Clean lines, minimal elements, modern sans-serif typography" },
  { id: "bold", label: "Bold", desc: "Strong & impactful", prompt: "Strong typography, bold shapes, high contrast colors" },
  { id: "vintage", label: "Vintage", desc: "Retro & classic", prompt: "Retro typography, worn textures, classic color palette" },
  { id: "tech", label: "Tech", desc: "Modern & digital", prompt: "Geometric shapes, gradient colors, modern futuristic font" },
  { id: "playful", label: "Playful", desc: "Fun & creative", prompt: "Rounded shapes, vibrant colors, fun typography" },
  { id: "luxury", label: "Luxury", desc: "Premium & elegant", prompt: "Gold accents, serif font, premium sophisticated aesthetic" },
  { id: "monogram", label: "Monogram", desc: "Initials mark", prompt: "Elegant monogram emblem, intertwined letterforms, balanced symmetry" },
  { id: "mascot", label: "Mascot", desc: "Character logo", prompt: "Friendly mascot character, illustrative style, expressive features" },
  { id: "abstract", label: "Abstract", desc: "Symbolic mark", prompt: "Abstract geometric mark, conceptual symbol, balanced negative space" },
];

const LogoGeneratorPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [brandName, setBrandName] = useState("");
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandName.trim()) {
      toast.error("Enter your brand name");
      return;
    }
    if (!hasEnoughCredits(2)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const style = STYLES.find((s) => s.id === styleId)!;
    const prompt = `Design a professional logo for a brand called "${brandName.trim()}". Style direction: ${style.prompt}. White background, vector-style, scalable. Do NOT write the style name or any label text below or around the logo. The logo should contain ONLY the brand name "${brandName.trim()}" stylized as a logo.`;

    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "logo-generator", prompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Logo created!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
  };

  const reset = () => {
    setResultUrl(null);
    setStage("compose");
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `logo-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <button
        onClick={() => {
          if (stage === "landing") navigate("/images");
          else if (stage === "compose") setStage("landing");
          else reset();
        }}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-xl border border-border/40 text-foreground hover:bg-background/60 transition"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* ─── LANDING ─── */}
          {stage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-8"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img src={logoHero} alt="AI Logo Generator" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-foreground">
                  Brand it <span className="text-primary">in seconds.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Type a name, pick a vibe, ship a logo.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => setStage("compose")}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center text-foreground font-semibold text-sm"
                  >
                    Start Designing
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
          {stage === "compose" && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[180px]">
                <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm mb-5`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                    <img src={logoHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  </div>
                </div>

                <div className="max-w-sm mx-auto rounded-[28px] p-4 bg-white/5 backdrop-blur-2xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_20px_60px_-20px_rgba(0,0,0,0.55)]">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Brand Name</h3>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Lumen, Northwave…"
                    className="w-full mb-5 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl backdrop-saturate-200 border border-white/15 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
                  />

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyleId(s.id)}
                        className={`px-2 py-3 rounded-2xl text-xs font-semibold backdrop-blur-xl backdrop-saturate-200 border transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] ${
                          styleId === s.id
                            ? "border-primary/60 bg-primary/25 text-foreground ring-1 ring-primary/40"
                            : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        <div>{s.label}</div>
                        <div className="text-[9px] opacity-60 font-normal mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              >
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGenerate}
                  className="w-full rounded-[26px] py-4 flex items-center justify-center text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                >
                  Generate Logo · 2 MC
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── GENERATING ─── */}
          {stage === "generating" && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            >
              <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                <div className="relative rounded-[24px] overflow-hidden aspect-square bg-white flex items-center justify-center">
                  <div className="font-display text-3xl text-foreground/70 tracking-tight px-4 text-center">
                    {brandName || "Your Brand"}
                  </div>
                  <motion.div
                    initial={{ y: "-100%" }}
                    animate={{ y: "260%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Crafting your brand mark…</div>
            </motion.div>
          )}

          {/* ─── RESULT ─── */}
          {stage === "result" && resultUrl && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm flex-1 max-h-[65vh]`}>
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-white">
                  <img src={resultUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain" />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={download}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-foreground font-semibold text-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <button
                onClick={reset}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Another Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LogoGeneratorPage;
