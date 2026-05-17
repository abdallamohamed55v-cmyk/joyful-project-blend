import { Download, Eye, Share2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AnimatedTemplateIcon from "./AnimatedTemplateIcon";

interface Props {
  title: string;
  templateLabel: string;
  templateId?: string;
  format: string;
  downloadUrl?: string;
}

export default function DocsArtifactCard({ title, templateLabel, templateId, format, downloadUrl }: Props) {
  const [sharing, setSharing] = useState(false);

  const openPreview = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    if (!downloadUrl || sharing) return;
    setSharing(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, text: title, url: downloadUrl });
          return;
        } catch { /* fall through */ }
      }
      await navigator.clipboard.writeText(downloadUrl);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("فشل المشاركة");
    } finally {
      setSharing(false);
    }
  };

  const isPreviewable = !!downloadUrl && /\.(pdf|md|markdown|txt|html)$/i.test(downloadUrl.split("?")[0]);

  return (
    <div className="mt-3 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm max-w-md">
      {/* Cover with animated template icon */}
      <div className="relative h-28 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-sky-500/15 grid place-items-center">
        <div className="text-indigo-600 dark:text-indigo-300">
          <AnimatedTemplateIcon id={templateId ?? ""} size={56} />
        </div>
        <div className="absolute top-2 right-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/60 bg-background/70 backdrop-blur px-2 py-0.5 rounded-full border border-border/40">
          {format}
        </div>
      </div>

      {/* Inline preview pane (PDF / MD / HTML) */}
      {isPreviewable && (
        <div className="h-44 border-y border-border/30 bg-background overflow-hidden">
          <iframe
            src={downloadUrl}
            title={title}
            className="w-full h-full"
            sandbox="allow-same-origin"
          />
        </div>
      )}

      {/* Title row */}
      <div className="px-4 pt-3 pb-2">
        <div className="text-[14px] font-semibold truncate">{title}</div>
        <div className="text-[11.5px] text-muted-foreground truncate">{templateLabel}</div>
      </div>

      {/* Actions — sit ABOVE message footer (like/dislike) */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <button
          onClick={openPreview}
          disabled={!downloadUrl}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-2xl bg-foreground text-background text-[12.5px] font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          <Eye className="w-4 h-4" />
          معاينة
        </button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-accent/40 hover:bg-accent/60 border border-border/40 transition"
            aria-label="تحميل"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={handleShare}
          disabled={!downloadUrl || sharing}
          aria-label="مشاركة"
          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-accent/40 hover:bg-accent/60 border border-border/40 transition disabled:opacity-50"
        >
          {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
