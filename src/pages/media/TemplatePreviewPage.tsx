import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import type { ShowcaseItem } from "@/components/showcase/ShowcaseGrid";

const TemplatePreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const stateItem = (location.state as { item?: ShowcaseItem } | null)?.item ?? null;
  const [item, setItem] = useState<ShowcaseItem | null>(stateItem);
  const [loading, setLoading] = useState(!stateItem);
  const [copied, setCopied] = useState(false);

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

  const handleReuse = () => {
    navigate(backTo, { state: { reusePrompt: prompt } });
  };

  return (
    <AppLayout>
      <div className="relative h-[100dvh] w-full bg-background flex flex-col">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <button
            onClick={() => navigate(backTo, { state: { tab: "community" } })}
            className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/85 hover:bg-muted/60 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">Template</h1>
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
          <div className="flex-1 overflow-y-auto pb-32">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pt-4"
            >
              {/* Media */}
              <div className="w-full max-w-[460px] mx-auto rounded-3xl overflow-hidden bg-muted aspect-[4/5]">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={prompt}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Prompt block */}
              <div className="mt-5 max-w-[460px] mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Prompt
                  </span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/85 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 hover:bg-muted transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 max-h-[40dvh] overflow-y-auto">
                  <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                    {prompt || "—"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sticky reuse bar */}
        {item && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
            <div className="max-w-[460px] mx-auto">
              <button
                onClick={handleReuse}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition active:scale-[0.98] shadow-lg shadow-primary/20"
              >
                Reuse Prompt
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TemplatePreviewPage;
