import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import cartoonHero from "@/assets/cartoon-hero.jpg";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import type { ToolTemplate } from "@/components/layout/ToolPageLayout";

type Stage = "landing" | "browse" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const CartoonPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const { templates } = useToolTemplates("cartoon");

  const [stage, setStage] = useState<Stage>("landing");
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setStage("browse");
    };
    reader.readAsDataURL(file);
  };

  const generateCartoon = async () => {
    if (!uploadedImage || !selectedTemplate) return;
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    try {
      const fullPrompt = `${selectedTemplate.prompt}. Keep the exact facial features, identity and expression from the uploaded photo.`;
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "cartoon", image: uploadedImage, prompt: fullPrompt },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Cartoon generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("browse");
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
      {/* Floating back button */}
      <button
        onClick={() => {
          if (stage === "landing") navigate("/images");
          else if (stage === "result") setStage("browse");
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
              {/* Hero card */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} flex-1 max-h-[55vh]`}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                  <img
                    src={cartoonHero}
                    alt="Cartoon avatar"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <h2 className="font-display text-[10vw] sm:text-[6vw] uppercase leading-[0.95] tracking-tight text-foreground">
                  Cartoon <span className="text-primary">me.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload one selfie, pick a style, become a cartoon.
                </p>
              </motion.div>

              {/* Upload button */}
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
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center text-foreground font-semibold text-sm"
                  >
                    Upload Photo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── BROWSE ─── */}
          {stage === "browse" && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[140px]">
                {uploadedImage && (
                  <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm mb-5`}>
                    <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                      <img
                        src={uploadedImage}
                        alt="Your photo"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Templates */}
                <div className="max-w-sm mx-auto">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Styles
                  </h3>
                  {templates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Loading styles…
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <motion.button
                            key={t.id}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setSelectedTemplate(isSelected ? null : t)}
                            className={`group relative rounded-2xl overflow-hidden border text-left aspect-[3/4] transition ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/60 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
                                : "border-border/30 bg-card"
                            }`}
                          >
                            {t.preview_url ? (
                              <img
                                src={t.preview_url}
                                alt={t.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-fuchsia-500/15 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                              <p className="text-xs font-semibold text-white">{t.name}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-lg ring-2 ring-white/90">
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Generate bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              >
                {selectedTemplate ? (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={generateCartoon}
                    className="w-full rounded-[26px] py-4 flex items-center justify-center text-white font-semibold text-sm bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                  >
                    Generate · 1 MC
                  </motion.button>
                ) : (
                  <motion.button
                    disabled
                    className="w-full rounded-[26px] py-4 flex items-center justify-center text-foreground/70 font-semibold text-sm bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_24px_-8px_rgba(0,0,0,0.4)]"
                  >
                    Pick a style
                  </motion.button>
                )}
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
              {uploadedImage && (
                <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5]">
                    <img
                      src={uploadedImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "260%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                    />
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Cartoonifying your photo…
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
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "cartoon.png";
                    a.target = "_blank";
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-foreground/5 border border-border/40 text-foreground font-semibold text-sm"
                >
                  Share
                </button>
              </div>
              <button
                onClick={() => {
                  setStage("browse");
                  setResultUrl(null);
                  setSelectedTemplate(null);
                }}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium"
              >
                Try Another Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CartoonPage;
