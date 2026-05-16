import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Download, Share2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import productHero from "@/assets/product-photo-hero.jpg";

type Stage = "landing" | "compose" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const SCENES: { id: string; name: string; prompt: string; swatch: string }[] = [
  { id: "studio",    name: "Studio White", prompt: "on a seamless pure white studio backdrop with soft professional key light and subtle shadow, e-commerce hero shot",                  swatch: "linear-gradient(135deg,#ffffff,#dcdcdc)" },
  { id: "marble",    name: "Dark Marble",  prompt: "floating above a glossy black marble podium, dramatic rim lighting, luxury reflection, premium brand aesthetic",                       swatch: "linear-gradient(135deg,#2c2c2c,#0a0a0a)" },
  { id: "gradient",  name: "Gradient Pop", prompt: "centered on a vibrant pink-to-orange gradient backdrop, soft floor reflection, bold modern advertising look",                          swatch: "linear-gradient(135deg,#ff6a3d,#ff2d75)" },
  { id: "nature",    name: "Botanical",    prompt: "surrounded by fresh green leaves and soft dappled sunlight, organic natural product photography, earthy tones",                        swatch: "linear-gradient(135deg,#34d399,#065f46)" },
  { id: "lifestyle", name: "Lifestyle",    prompt: "in a cozy modern interior, soft window daylight, beige tones, lifestyle product placement, hand-held feel",                            swatch: "linear-gradient(135deg,#e7d3b6,#b08968)" },
  { id: "smoke",     name: "Smoke & Neon", prompt: "with cinematic teal and magenta neon rim lighting, soft drifting smoke, glossy reflective floor, hero ad composition",                 swatch: "linear-gradient(135deg,#16e0bd,#ff3df0)" },
];

const ProductPhotoPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [presetId, setPresetId] = useState<string>(SCENES[0].id);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a product image");
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
    if (!image) { toast.error("Upload a product first"); return; }
    if (!hasEnoughCredits(2)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    const preset = SCENES.find((p) => p.id === presetId)!;
    const fullPrompt = [prompt.trim(), preset.prompt].filter(Boolean).join(", ");
    setStage("generating");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "product-photo", image, prompt: fullPrompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Product shot ready!");
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
                  <img src={productHero} alt="Product Photography" className="absolute inset-0 w-full h-full object-cover" />
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
                  Sell with <span className="text-primary">light.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop any product photo, pick a scene, get a luxury studio shot.
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
                    <Upload className="w-4 h-4" /> Upload Product
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
                    <img src={image} alt="Your product" className="absolute inset-0 w-full h-full object-cover" />
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

                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Scene</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {SCENES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPresetId(p.id)}
                        className={`relative px-2 py-3 rounded-2xl text-xs font-semibold border overflow-hidden transition ${
                          presetId === p.id
                            ? "border-primary text-foreground ring-2 ring-primary/40"
                            : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        <span className="absolute inset-0 opacity-30" style={{ background: p.swatch }} />
                        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Describe (optional)</h3>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Floating perfume bottle with golden mist and soft shadow..."
                    rows={3}
                    className="w-full resize-none px-4 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-foreground/10 transition"
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
                  <Sparkles className="w-4 h-4" /> Shoot · 2 MC
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" /> Styling the studio…
              </div>
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
                    a.download = "product-photo.png";
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
                <Package className="w-4 h-4" /> New Scene
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductPhotoPage;
