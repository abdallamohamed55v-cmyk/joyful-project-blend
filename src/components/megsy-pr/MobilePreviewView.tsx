import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw, Slash, Upload, X, Search } from "lucide-react";
import MegsyPrPublishPage from "@/pages/megsy-pr/MegsyPrPublishPage";
import { toast } from "sonner";
import MegsyStar from "@/components/files/MegsyStar";

interface BuildFile { path: string; content: string }

interface Props {
  projectId: string;
  projectName: string;
  files: BuildFile[];
  previewUrl?: string | null;
  publishedUrl?: string | null;
  hasUnpublishedChanges?: boolean;
  onPublished?: (url: string) => void;
  onIframeReady?: (el: HTMLIFrameElement | null) => void;
  step?: string | null;
  streaming?: boolean;
}

const LOADING_LINES = [
  "نُحضّر تجربتك… لحظات وتنطلق.",
  "نُلمّع كل تفصيلة بعناية.",
  "نُرتّب الواجهة لتبدو مذهلة.",
  "تجربة استثنائية على وشك الظهور.",
];

const LoadingShowcase = ({ message }: { message: string }) => {
  const lines = useMemo(() => [message, ...LOADING_LINES.filter((l) => l !== message)], [message]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % lines.length), 2800);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <div className="absolute inset-0 bottom-[96px] grid place-items-center bg-background p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-20 h-20 grid place-items-center">
          <span className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <span className="absolute inset-2 rounded-full bg-primary/10 animate-ping" />
          <MegsyStar size={48} />
        </div>
        <p
          key={idx}
          className="text-center text-[16px] md:text-[17px] font-semibold leading-snug text-foreground animate-fade-in max-w-xs"
          dir="auto"
        >
          {lines[idx]}
        </p>
      </div>
    </div>
  );
};

export default function MobilePreviewView({
  projectId, projectName, files, previewUrl, publishedUrl,
  hasUnpublishedChanges, onPublished, onIframeReady, step, streaming,
}: Props) {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [routesOpen, setRoutesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [routePath, setRoutePath] = useState("/");
  const [reloadKey, setReloadKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [currentPublishedUrl, setCurrentPublishedUrl] = useState<string | null>(publishedUrl ?? null);
  const [checkedUrl, setCheckedUrl] = useState<string | null>(null);
  const [checkingPreview, setCheckingPreview] = useState(false);

  useEffect(() => { setCurrentPublishedUrl(publishedUrl ?? null); }, [publishedUrl]);

  useEffect(() => { onIframeReady?.(iframeRef.current); }, [onIframeReady, reloadKey, previewUrl]);

  // Reset loaded state whenever the preview source or reload key changes
  useEffect(() => { setIframeLoaded(false); }, [reloadKey, previewUrl, publishedUrl, routePath]);

  // Auto-reload preview whenever project files change (e.g. after the AI updates code).
  // Skip the very first render and any moment we're actively streaming, then debounce
  // a tiny bit so multiple rapid file writes only trigger one refresh.
  const filesSignature = useMemo(
    () => files.map((f) => `${f.path}:${(f.content || "").length}`).join("|"),
    [files]
  );
  const firstSignatureRef = useRef(true);
  useEffect(() => {
    if (firstSignatureRef.current) { firstSignatureRef.current = false; return; }
    if (streaming) return;
    const t = setTimeout(() => setReloadKey((k) => k + 1), 400);
    return () => clearTimeout(t);
  }, [filesSignature, streaming]);

  // Extract routes from project files (parse `path="..."` patterns)
  const routes = useMemo(() => {
    const set = new Set<string>(["/"]);
    const re = /path\s*=\s*["'`]([^"'`]+)["'`]/g;
    for (const f of files) {
      if (!/\.(tsx|jsx|ts|js)$/.test(f.path)) continue;
      let m: RegExpExecArray | null;
      while ((m = re.exec(f.content || "")) !== null) {
        const p = m[1];
        if (p.startsWith("/") && !p.startsWith("//") && p.length < 80) set.add(p);
      }
    }
    return Array.from(set).sort();
  }, [files]);

  const hasNewerPreview = !!previewUrl && previewUrl !== currentPublishedUrl;
  const baseUrl = hasNewerPreview ? previewUrl : (currentPublishedUrl || previewUrl || "");
  const visibleBaseUrl = checkedUrl || (currentPublishedUrl && !hasNewerPreview ? currentPublishedUrl : "");
  const fullUrl = visibleBaseUrl ? visibleBaseUrl.replace(/\/+$/, "") + routePath : "";

  const goRoute = (p: string) => {
    const safe = p.startsWith("/") ? p : "/" + p;
    setRoutePath(safe);
    setReloadKey((k) => k + 1);
    setRoutesOpen(false);
  };

  const refreshPreview = () => {
    setCheckedUrl(null);
    setCheckingPreview(!!baseUrl);
    setIframeLoaded(false);
    setReloadKey((k) => k + 1);
    toast("Refreshing preview");
  };

  useEffect(() => {
    if (!baseUrl) {
      setCheckedUrl(null);
      setCheckingPreview(false);
      return;
    }
    let cancelled = false;
    let timer: number | null = null;
    const target = baseUrl.replace(/\/+$/, "") + "/";

    const probe = async () => {
      setCheckingPreview(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        await fetch(`${target}?preview_probe=${Date.now()}`, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });
        if (cancelled) return;
        setCheckedUrl(baseUrl);
        setCheckingPreview(false);
      } catch {
        if (cancelled) return;
        timer = window.setTimeout(probe, 10000);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    setCheckedUrl(null);
    probe();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [baseUrl]);

  return (
    <div className="relative flex flex-col h-[100dvh] bg-background text-foreground">
      {/* Preview iframe — fullscreen, no edges */}
      <div className="flex-1 relative overflow-hidden">
        {fullUrl ? (
          <>
            <iframe
              key={reloadKey}
              ref={iframeRef}
              src={fullUrl}
              title="preview"
              onLoad={() => setIframeLoaded(true)}
              className={`absolute top-0 left-0 right-0 bottom-[96px] w-full border-0 transition-opacity duration-300 ${
                iframeLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: "calc(100% - 96px)" }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
            {!iframeLoaded && (
              <LoadingShowcase
                message={
                  streaming
                    ? "نُشكّل تجربة استثنائية لمشروعك… استعد لشيء يخطف الأنفاس."
                    : checkingPreview
                    ? "نفحص رابط البريفيو فعليًا… سيظهر فور جاهزيته."
                    : "نُحضّر موقعك بأبهى صورة… لحظات وتنطلق التجربة."
                }
              />
            )}
          </>
        ) : (
          <LoadingShowcase
            message={
              streaming
                ? "السحر قيد الصنع… مشروعك يُولد أمام عينيك."
                : checkingPreview
                ? "نفحص رابط البريفيو فعليًا… المحاولة التالية خلال ثوانٍ."
                : "ابدأ المحادثة وشاهد فكرتك تتحوّل إلى موقع حيّ خلال لحظات."
            }
          />
        )}
      </div>

      {/* Floating glass bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-5 pt-2 pointer-events-none animate-fade-in">
        {currentPublishedUrl ? (
          <div
            className="pointer-events-auto flex items-center gap-2 rounded-full pl-2 pr-1.5 h-14
                       bg-white/15 dark:bg-white/[0.03]
                       [backdrop-filter:blur(48px)_saturate(220%)] [-webkit-backdrop-filter:blur(48px)_saturate(220%)]
                       ring-1 ring-white/30 dark:ring-white/10
                       shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]"
          >
            <button
              onClick={() => navigate(`/build/${projectId}/chat`)}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full
                         bg-white/55 dark:bg-white/10 backdrop-blur-md
                         ring-1 ring-white/40 dark:ring-white/10
                         text-[14px] font-medium text-foreground
                         hover:bg-white/70 dark:hover:bg-white/15 transition shrink-0"
            >
              <ChevronLeft className="w-4 h-4" /> Chat
            </button>
            <div className="flex-1" />

            <button
              onClick={() => setPublishOpen(true)}
              disabled={!hasNewerPreview && !hasUnpublishedChanges}
              className={`relative h-10 px-4 rounded-full text-[13px] font-semibold flex items-center gap-1.5 shrink-0 transition ${
                hasNewerPreview || hasUnpublishedChanges
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-foreground/10 text-foreground/60"
              }`}
              title={hasNewerPreview || hasUnpublishedChanges ? "نشر التعديلات الجديدة" : "محدّث"}
            >
              <Upload className="w-3.5 h-3.5" />
              {hasNewerPreview || hasUnpublishedChanges ? "تحديث" : "محدّث"}
            </button>
            <button
              onClick={refreshPreview}
              className="w-10 h-10 grid place-items-center rounded-full text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition shrink-0"
              title="Refresh preview"
            >
              <RefreshCw className={`w-4 h-4 ${checkingPreview ? "animate-spin" : ""}`} />
            </button>
          </div>
        ) : (
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full px-2 h-14
                     bg-white/15 dark:bg-white/[0.03]
                     [backdrop-filter:blur(48px)_saturate(220%)] [-webkit-backdrop-filter:blur(48px)_saturate(220%)]
                     ring-1 ring-white/30 dark:ring-white/10
                     shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]"
        >
          <button
            onClick={() => navigate(`/build/${projectId}/chat`)}
            className="flex items-center gap-1.5 px-4 h-10 rounded-full
                       bg-white/55 dark:bg-white/10 backdrop-blur-md
                       ring-1 ring-white/40 dark:ring-white/10
                       text-[14px] font-medium text-foreground
                       hover:bg-white/70 dark:hover:bg-white/15 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Chat
          </button>
          <div className="flex-1" />
          <button
            onClick={() => { setReloadKey((k) => k + 1); toast("Preview refreshed"); }}
            className="w-10 h-10 grid place-items-center rounded-full text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRoutesOpen(true)}
            className="w-10 h-10 grid place-items-center rounded-full text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition"
            title="Pages"
          >
            <Slash className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPublishOpen(true)}
            className="w-10 h-10 grid place-items-center rounded-full text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition"
            title="Publish"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
        )}
      </div>

      {/* Routes sheet */}
      {routesOpen && (
        <Sheet onClose={() => setRoutesOpen(false)} title="Open page">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 h-12 rounded-xl bg-foreground/[0.05] px-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={routePath}
                onChange={(e) => setRoutePath(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") goRoute(routePath); }}
                placeholder="/about"
                className="flex-1 bg-transparent outline-none text-[15px]"
              />
            </div>
            <button onClick={() => goRoute(routePath)} className="h-12 px-4 rounded-xl bg-foreground text-background text-sm font-semibold">
              Open
            </button>
          </div>
          <div className="text-xs text-muted-foreground mb-2 px-1">Pages in the project</div>
          <div className="max-h-[156px] overflow-y-auto rounded-xl bg-foreground/[0.03]">
            {routes.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No pages</div>}
            {routes.map((r) => (
              <button
                key={r}
                onClick={() => goRoute(r)}
                className={`w-full text-start px-4 py-3 text-[14px] hover:bg-foreground/[0.05] border-b border-foreground/5 last:border-0 ${
                  r === routePath ? "font-semibold text-primary" : ""
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {publishOpen && <MegsyPrPublishPage onClose={() => setPublishOpen(false)} onPublished={(url) => { setCurrentPublishedUrl(url); onPublished?.(url); setReloadKey((k) => k + 1); }} />}
    </div>
  );
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute bottom-0 inset-x-0 rounded-t-[28px] p-4 pb-6 backdrop-blur-2xl backdrop-saturate-150 border-t border-foreground/10 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.7)]"
        style={{ animation: "sheetUp 320ms cubic-bezier(0.32,0.72,0,1) both", backgroundColor: "color-mix(in oklab, hsl(var(--background)) 65%, transparent)" }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="w-9 h-1 rounded-full bg-foreground/25 mx-auto mb-3" />
        <div className="mb-3">
          <span className="text-[15px] font-semibold">{title}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
