import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import avatarHero from "@/assets/avatar-generator-hero.jpg";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const STYLES: { id: string; name: string; prompt: string; swatch: string }[] = [
  { id: "3d",         name: "3D Pixar",     prompt: "as a stylized 3D animated character, Pixar-style with big expressive eyes, soft volumetric lighting, keep facial features recognizable",   swatch: "linear-gradient(135deg,#ffb347,#ff7e5f)" },
  { id: "anime",      name: "Anime",        prompt: "as a Japanese anime character, sharp clean line art, cel shading, expressive eyes, studio-quality manga portrait, keep face recognizable",  swatch: "linear-gradient(135deg,#ff3df0,#5b8dff)" },
  { id: "pixel",      name: "Pixel Art",    prompt: "as a 16-bit pixel art retro game character portrait, crisp pixels, limited palette, keep facial features recognizable",                     swatch: "linear-gradient(135deg,#16e0bd,#0a2540)" },
  { id: "popart",     name: "Pop Art",      prompt: "as a bold pop-art portrait, halftone dots, vivid primary colors, Andy Warhol screenprint style, keep facial features recognizable",        swatch: "linear-gradient(135deg,#ff2d75,#ffd60a)" },
  { id: "watercolor", name: "Watercolor",   prompt: "as a delicate watercolor painted portrait, soft washes of color, paper texture, artistic and dreamy, keep features recognizable",           swatch: "linear-gradient(135deg,#a7c7e7,#ffb6c1)" },
  { id: "comic",      name: "Comic Hero",   prompt: "as a Marvel-style comic book superhero portrait, bold ink lines, dramatic shading, vibrant colors, keep facial features recognizable",     swatch: "linear-gradient(135deg,#c8102e,#ffd60a)" },
  { id: "claymation", name: "Clay",         prompt: "as a charming claymation stop-motion character portrait, soft sculpted clay textures, studio lighting, keep features recognizable",         swatch: "linear-gradient(135deg,#ff7e5f,#feb47b)" },
  { id: "cyber",      name: "Cyberpunk",    prompt: "as a cyberpunk avatar portrait, neon teal and magenta lighting, futuristic visor accents, glowing details, keep facial features",          swatch: "linear-gradient(135deg,#16e0bd,#ff3df0)" },
  { id: "lego",       name: "LEGO",         prompt: "as a LEGO minifigure-style 3D character portrait, plastic shading, blocky charm, keep facial features recognizable",                       swatch: "linear-gradient(135deg,#ffd60a,#c8102e)" },
];

const AvatarGeneratorPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [styleId, setStyleId] = useState<string>(STYLES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a portrait image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setStage("compose");
      setResultUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!image) { toast.error("Upload a photo first"); return; }
    if (!hasEnoughCredits(3)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const style = STYLES.find((p) => p.id === styleId)!;
    const fullPrompt = [prompt.trim(), style.prompt].filter(Boolean).join(", ");
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "avatar-generator", image, prompt: fullPrompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Avatar ready!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("compose");
    }
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
          else if (stage === "result") setStage("compose");
          else setStage("landing");
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
                  <img src={avatarHero} alt="Avatar Generator" className="absolute inset-0 w-full h-full object-cover" />
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
                  Become an <span className="text-primary">avatar.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop a selfie, pick a style, get a stunning AI avatar.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── COMPOSE ─── */}
          {stage === "compose" && image && (
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
                    <img src={image} alt="Your photo" className="absolute inset-0 w-full h-full object-cover" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-background/70 backdrop-blur-md border border-border/40 text-foreground"
                    >
                      Replace
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                    />
                  </div>
                </div>

                <div className="max-w-sm mx-auto rounded-[28px] p-4 bg-white/5 backdrop-blur-2xl backdrop-saturate-200 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_20px_60px_-20px_rgba(0,0,0,0.55)]">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Avatar Style</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {STYLES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setStyleId(p.id)}
                        className={`relative px-2 py-3 rounded-2xl text-xs font-semibold backdrop-blur-xl backdrop-saturate-200 border overflow-hidden transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] ${
                          styleId === p.id
                            ? "border-primary/60 text-foreground ring-1 ring-primary/40"
                            : "border-white/15 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        <span className="absolute inset-0 opacity-25" style={{ background: p.swatch }} />
                        <span className="absolute inset-0 bg-white/5" />
                        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Describe (optional)</h3>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Wearing a futuristic hoodie, cosmic background..."
                    rows={3}
                    className="w-full resize-none px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl backdrop-saturate-200 border border-white/15 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
                  />
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
                  className="w-full rounded-[26px] py-4 flex items-center justify-center gap-2 text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                >
                  Generate Avatar · 3 MC
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
              {image && (
                <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                    />
                  </div>
                </div>
              )}
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
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "avatar.png";
                    a.target = "_blank";
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-foreground font-semibold text-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <button
                onClick={() => { setStage("compose"); setResultUrl(null); }}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <UserCircle2 className="w-4 h-4" /> Try Another Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AvatarGeneratorPage;
