import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, Check, Plus, X, Download, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import type { ShowcaseItem } from "@/components/showcase/ShowcaseGrid";

type Stage = "preview" | "upload" | "generating" | "result";

const GRADIENT_BORDER =
  "rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]";

// Heuristic to detect how many input photos a template needs based on its prompt
const detectInputCount = (prompt: string): 1 | 2 => {
  const p = prompt.toLowerCase();
  const twoSignals = [
    "swap", "combine", "merge", "blend", "two people", "couple",
    "with another", "between", "two photos", "transfer", "replace face",
    "outfit from", "style from", "reference", "compose", "duo",
  ];
  return twoSignals.some(k => p.includes(k)) ? 2 : 1;
};

const TemplatePreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const stateItem = (location.state as { item?: ShowcaseItem } | null)?.item ?? null;
  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  const [item, setItem] = useState<ShowcaseItem | null>(stateItem);
  const [loading, setLoading] = useState(!stateItem);
  const [copied, setCopied] = useState(false);

  const [stage, setStage] = useState<Stage>("preview");
  const [photos, setPhotos] = useState<(string | null)[]>([null, null]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"image" | "video">("image");
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (item || !id) return;
    (async () => {
      const { data } = await supabase
        .from("showcase_items" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) setItem(data as any);
      setLoading(false);
    })();
  }, [id, item]);

  const isVideo = item?.media_type === "video";
  const mediaUrl = (item as any)?.media_url as string | undefined;
  const prompt = item?.prompt || "";
  const backTo = isVideo ? "/videos" : "/images";
  const inputCount = useMemo(() => detectInputCount(prompt), [prompt]);
  const requiredFilled = photos.slice(0, inputCount).every(Boolean);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const pickFile = (slot: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos(prev => {
        const next = [...prev];
        next[slot] = e.target?.result as string;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!requiredFilled) {
      toast.error(inputCount === 2 ? "Add both photos" : "Add a photo");
      return;
    }
    const cost = isVideo ? 5 : 1;
    if (userId && !hasEnoughCredits(cost)) {
      toast.error("Insufficient credits");
      navigate("/pricing");
      return;
    }
    setStage("generating");
    try {
      const endpoint = isVideo ? "generate-video" : "generate-image";
      const body: Record<string, any> = {
        prompt,
        user_id: userId,
        credits_cost: cost,
      };
      if (!isVideo) {
        body.num_images = 1;
        body.image_size = { width: 1024, height: 1024 };
      }
      // Primary input image
      body.image_url = photos[0];
      // Optional second reference
      if (inputCount === 2 && photos[1]) body.reference_image_url = photos[1];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      const url: string | undefined = isVideo
        ? data.video_url
        : (data.image_url || (Array.isArray(data.image_urls) ? data.image_urls[0] : undefined));
      if (!url) throw new Error("No result returned");

      setResultUrl(url);
      setResultType(isVideo ? "video" : "image");
      setStage("result");
      refreshCredits();
      toast.success("Done!");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
      setStage("upload");
    }
  };

  const reset = () => {
    setStage("preview");
    setPhotos([null, null]);
    setResultUrl(null);
  };

  const goBack = () => {
    if (stage === "preview") navigate(backTo, { state: { tab: "community" } });
    else if (stage === "result") reset();
    else setStage("preview");
  };

  return (
    <AppLayout>
      <div className="relative h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/85 hover:bg-muted/60 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">
            {stage === "preview" && "Template"}
            {stage === "upload" && (inputCount === 2 ? "Add 2 photos" : "Add a photo")}
            {stage === "generating" && "Generating…"}
            {stage === "result" && "Result"}
          </h1>
          <div className="w-9" />
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !item ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Template not found
          </div>
        ) : (
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ───── PREVIEW ───── */}
              {stage === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-y-auto pb-32"
                >
                  <div className="px-4 pt-4">
                    <div className={`${GRADIENT_BORDER} w-full max-w-[460px] mx-auto`}>
                      <div className="rounded-[24px] overflow-hidden bg-muted aspect-[4/5]">
                        {isVideo ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
                        ) : (
                          <img src={mediaUrl} alt={prompt} className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>

                    <div className="mt-5 max-w-[460px] mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt</span>
                        <button
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/85 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 hover:bg-muted transition"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 max-h-[32dvh] overflow-y-auto">
                        <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                          {prompt || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───── UPLOAD ───── */}
              {stage === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 overflow-y-auto pb-32"
                >
                  <div className="px-4 pt-6 max-w-[460px] mx-auto">
                    <p className="text-center text-sm text-muted-foreground mb-5">
                      {inputCount === 2
                        ? "Upload two photos to apply this template."
                        : "Upload one photo to apply this template."}
                    </p>

                    <div className={`grid ${inputCount === 2 ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                      {Array.from({ length: inputCount }).map((_, i) => {
                        const photo = photos[i];
                        return (
                          <div key={i}>
                            <input
                              ref={fileInputRefs[i]}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) pickFile(i, e.target.files[0]);
                                e.target.value = "";
                              }}
                            />
                            <div className={`${GRADIENT_BORDER}`}>
                              <button
                                type="button"
                                onClick={() => fileInputRefs[i].current?.click()}
                                className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-muted flex items-center justify-center text-muted-foreground"
                              >
                                {photo ? (
                                  <>
                                    <img src={photo} alt={`Photo ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPhotos(prev => { const n = [...prev]; n[i] = null; return n; });
                                      }}
                                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </span>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-background/60 border border-border/50 flex items-center justify-center">
                                      <Plus className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-medium">
                                      {inputCount === 2 ? (i === 0 ? "Main photo" : "Reference") : "Add photo"}
                                    </span>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Template thumbnail reference */}
                    <div className="mt-5 flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                        {isVideo ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                        ) : (
                          <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-[12px] text-foreground/80 line-clamp-2">{prompt}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───── GENERATING ───── */}
              {stage === "generating" && (
                <motion.div
                  key="gen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
                >
                  <div className={`${GRADIENT_BORDER} w-full max-w-xs`}>
                    <div className="relative rounded-[24px] overflow-hidden aspect-[4/5] bg-muted">
                      {photos[0] && (
                        <img src={photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: "260%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1/2 pointer-events-none bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    Working the magic…
                  </div>
                </motion.div>
              )}

              {/* ───── RESULT ───── */}
              {stage === "result" && resultUrl && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col px-5 pt-5 pb-32"
                >
                  <div className={`${GRADIENT_BORDER} mx-auto w-full max-w-sm flex-1 max-h-[60vh]`}>
                    <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-muted">
                      {resultType === "video" ? (
                        <video src={resultUrl} className="absolute inset-0 w-full h-full object-cover" controls autoPlay loop playsInline />
                      ) : (
                        <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sticky bottom bar */}
        {item && stage !== "generating" && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
            <div className="max-w-[460px] mx-auto">
              {stage === "preview" && (
                <button
                  onClick={() => setStage("upload")}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition active:scale-[0.98] shadow-lg shadow-primary/20 inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Use Template
                </button>
              )}
              {stage === "upload" && (
                <button
                  onClick={generate}
                  disabled={!requiredFilled}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm transition active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate · {isVideo ? "5" : "1"} MC
                </button>
              )}
              {stage === "result" && resultUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = resultUrl;
                      a.download = resultType === "video" ? "result.mp4" : "result.png";
                      a.target = "_blank";
                      a.click();
                    }}
                    className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={reset}
                    className="h-12 px-4 rounded-2xl bg-muted/60 border border-border/50 text-foreground font-medium text-sm inline-flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TemplatePreviewPage;
