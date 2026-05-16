import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Download, Share2, Plus, Upload, ImagePlus, X, Wand2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { CLOTHES_STYLES, FOOTBALL_CLUBS, getFootballPrompt } from "@/lib/imageToolsData";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import type { ToolTemplate } from "@/components/layout/ToolPageLayout";
import clothesHero from "@/assets/clothes-hero.jpg";

type Stage = "landing" | "edit" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const ClothesChangerPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const { templates } = useToolTemplates("clothes-changer");

  const [stage, setStage] = useState<Stage>("landing");
  const [image, setImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showClubs, setShowClubs] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──
  const readFile = (file: File, cb: (data: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = (file: File) => {
    readFile(file, (data) => {
      setImage(data);
      setStage("edit");
    });
  };

  const handleRefUpload = (file: File) => {
    readFile(file, setRefImage);
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt ?? (selectedTemplate?.prompt || prompt);
    if (!image) return toast.error("Upload your photo first");
    if (!finalPrompt?.trim()) return toast.error("Describe the outfit or pick a style");
    if (!hasEnoughCredits(4)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    toast.success("Generating… you'll find it in your gallery");
    navigate("/images");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "clothes-changer", image, prompt: finalPrompt, ref: refImage || undefined },
      });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || "Failed");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
  };

  const handleStyleClick = (style: typeof CLOTHES_STYLES[0]) => {
    if (style.id === "football") {
      setShowClubs(true);
      return;
    }
    if (style.id === "blank") return; // just focus prompt
    if (style.prompt) handleGenerate(style.prompt);
  };

  const visibleStyles = CLOTHES_STYLES.filter((s) => s.id !== "blank");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header — floating iOS-style glass */}
      {/* Floating back button */}
      <button
        onClick={() => (stage === "landing" ? navigate("/images") : setStage("landing"))}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-black/60 transition"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ─── LANDING ─── */}
          {stage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+4rem)] pb-8 overflow-y-auto"
            >
              {/* Hero card — portrait aspect so the image never stretches */}
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm`}
              >
                <div className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-neutral-900">
                  <img
                    src={clothesHero}
                    alt="Before and after virtual try-on"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  {/* Subtle vignette + bottom gradient for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  {/* Before / After labels */}
                  <div className="absolute top-3 left-3 text-[10px] font-bold tracking-[0.2em] px-2 py-1 rounded-full bg-black/45 backdrop-blur-md text-white/90">
                    BEFORE
                  </div>
                  <div className="absolute top-3 right-3 text-[10px] font-bold tracking-[0.2em] px-2 py-1 rounded-full bg-primary/90 text-primary-foreground">
                    AFTER
                  </div>

                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-7 text-center"
              >
                <h2 className="font-display text-4xl sm:text-5xl leading-[0.95] tracking-tight">
                  Change any <span className="text-primary italic">outfit</span>
                </h2>
                <p className="mt-2.5 text-sm text-muted-foreground max-w-xs mx-auto">
                  Upload your photo, then pick a style or describe the look you want.
                </p>
              </motion.div>

              {/* Prompt bar (upload + prompt + generate) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mt-6"
              >
                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <div className={GRADIENT_BORDER}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => uploadRef.current?.click()}
                    className="w-full bg-background rounded-[24px] py-4 flex items-center justify-center gap-2 text-foreground font-semibold text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── EDIT ─── */}
          {stage === "edit" && image && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Centered user photo */}
              <div className="flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[180px] flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className={`${GRADIENT_BORDER} w-full max-w-sm`}
                >
                  <div className="relative rounded-[24px] overflow-hidden bg-muted aspect-[4/5]">
                    <img src={image} alt="Your photo" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </motion.div>

                {refImage && (
                  <div className="mt-4 w-full max-w-sm flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <img src={refImage} alt="ref" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-xs text-muted-foreground flex-1">Reference outfit attached</span>
                    <button onClick={() => setRefImage(null)} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Templates from DB — shown under the photo */}
                {templates.length > 0 && (
                  <div className="mt-6 w-full max-w-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Templates</h3>
                      
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <motion.button
                            key={`tpl-${t.id}`}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setSelectedTemplate(isSelected ? null : t);
                              setPrompt("");
                            }}
                            className={`group relative rounded-2xl overflow-hidden border text-left aspect-[3/4] transition ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/60 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
                                : "border-white/10 bg-card"
                            }`}
                          >
                            {t.preview_url ? (
                              <img src={t.preview_url} alt={t.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-fuchsia-500/10 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-muted-foreground/40" />
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
                  </div>
                )}
              </div>


              {/* Bottom prompt bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32, delay: 0.05 }}
                className="absolute bottom-0 inset-x-0 z-20 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              >
                <div className="w-full max-w-md mx-auto flex items-end gap-2 bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-200 border border-white/20 dark:border-white/10 rounded-3xl pl-2 pr-2 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                  <input
                    ref={refInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleRefUpload(e.target.files[0])}
                  />
                  <button
                    onClick={() => refInputRef.current?.click()}
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition"
                    aria-label="Upload photo"
                    title="Upload reference outfit"
                  >
                    {refImage ? <ImagePlus className="w-[18px] h-[18px] text-primary" /> : <Upload className="w-[18px] h-[18px]" />}
                  </button>
                  {selectedTemplate && (
                    <div className="relative shrink-0 self-center">
                      {selectedTemplate.preview_url ? (
                        <img src={selectedTemplate.preview_url} alt={selectedTemplate.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/60" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center ring-2 ring-primary/60">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 border border-white/20 flex items-center justify-center text-white/90"
                        aria-label="Remove template"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 160) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    rows={1}
                    placeholder={selectedTemplate ? "Add details (optional)…" : "Describe an outfit…"}
                    className="flex-1 self-center bg-transparent text-[11px] text-white outline-none placeholder:text-white/50 px-1 min-w-0 resize-none leading-[14px] py-1 max-h-40 overflow-y-auto"
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    onClick={() => handleGenerate()}
                    className={
                      selectedTemplate
                        ? "shrink-0 self-end h-10 px-4 rounded-full text-white text-sm font-bold flex items-center justify-center min-w-[92px] bg-primary/35 backdrop-blur-2xl backdrop-saturate-200 border border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_30px_-8px_hsl(var(--primary)/0.55)]"
                        : "shrink-0 self-end h-10 px-4 rounded-full text-foreground/80 text-sm font-bold flex items-center justify-center min-w-[92px] bg-white/10 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_24px_-8px_rgba(0,0,0,0.4)]"
                    }
                  >
                    Generate
                  </motion.button>
                </div>
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
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5]">
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                Tailoring your new look…
              </div>
            </motion.div>
          )}

          {/* ─── RESULT ─── */}
          {stage === "result" && resultUrl && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="absolute inset-0 flex flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <div className={`${GRADIENT_BORDER} flex-1`}>
                <div className="relative rounded-[24px] overflow-hidden bg-muted h-full">
                  <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-contain" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "clothes-result.png";
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resultUrl);
                    toast.success("Link copied");
                  }}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-foreground"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  setResultUrl(null);
                  setStage("edit");
                }}
                className="mt-2 w-full py-3 rounded-full bg-white/5 border border-white/10 text-sm font-semibold"
              >
                Try another style
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Football Clubs Bottom Sheet ─── */}
        <AnimatePresence>
          {showClubs && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowClubs(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 36 }}
                className="absolute bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t border-white/10 rounded-t-3xl pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] max-h-[80vh] flex flex-col"
              >
                <div className="mx-auto w-10 h-1 rounded-full bg-white/20 mb-3" />
                <div className="px-5 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">Pick a club</h3>
                  <button onClick={() => setShowClubs(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {FOOTBALL_CLUBS.map((club) => (
                      <motion.button
                        key={club.name}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setShowClubs(false);
                          handleGenerate(getFootballPrompt(club));
                        }}
                        className="px-3 py-3 rounded-2xl text-left bg-white/5 border border-white/10 hover:border-primary/40 transition-colors"
                      >
                        <p className="text-sm font-semibold text-foreground">{club.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{club.colors}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClothesChangerPage;
