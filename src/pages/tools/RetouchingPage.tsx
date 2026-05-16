import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import retouchingHero from "@/assets/retouching-hero.jpg";

type Stage = "landing" | "processing" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

const RetouchingPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [stage, setStage] = useState<Stage>("landing");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setSourceImage(dataUrl);
      await retouch(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const retouch = async (dataUrl: string) => {
    if (!hasEnoughCredits(1)) {
      toast.error("Insufficient MC");
      navigate("/pricing");
      return;
    }
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "retouching", image: dataUrl },
      });
      if (error) throw error;
      const url = data?.url;
      if (!url) throw new Error(data?.error || "No image generated");
      setResultUrl(url);
      setStage("result");
      toast.success("Retouched!");
    } catch (e: any) {
      toast.error(e.message || "Retouching failed");
      setStage("landing");
    }
  };

  const reset = () => {
    setSourceImage(null);
    setResultUrl(null);
    setStage("landing");
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `retouched-${Date.now()}.png`;
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
          else reset();
        }}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-xl border border-border/40 text-foreground hover:bg-background/60 transition"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
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
                  <img
                    src={retouchingHero}
                    alt="Retouching"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
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
                  Flawless <span className="text-primary">in seconds.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Smooth skin, remove blemishes, and polish portraits naturally.
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
                    Upload Photo · 1 MC
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {stage === "processing" && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            >
              {sourceImage && (
                <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                  <div className="relative rounded-[24px] overflow-hidden aspect-[4/5]">
                    <img
                      src={sourceImage}
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
              <div className="text-sm text-muted-foreground">Retouching your portrait…</div>
            </motion.div>
          )}

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
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="mt-4 max-w-sm mx-auto w-full flex gap-3">
                <button
                  onClick={download}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  <Download className="w-4 h-4" />
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
                onClick={reset}
                className="mt-3 max-w-sm mx-auto w-full py-3 rounded-2xl bg-foreground/5 border border-border/30 text-foreground text-sm font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Another Photo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RetouchingPage;
