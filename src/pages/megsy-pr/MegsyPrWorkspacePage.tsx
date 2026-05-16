import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUp, Loader2, FileCode, Eye, Code2, Sparkles, Rocket, ExternalLink, Globe, Save, History, RotateCcw, Upload, Github, Download, Database, Check, Unlink, Smartphone, Tablet, Monitor, DollarSign, X, FileDiff, MousePointerClick, ShieldCheck, Brain, BarChart3, AlertTriangle, CheckCircle2, Menu } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { prepareProjectFilesForDeploy } from "@/lib/projectBuildGuards";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileChatView from "@/components/megsy-pr/MobileChatView";
import MobilePreviewView from "@/components/megsy-pr/MobilePreviewView";
import AppSidebar from "@/components/layout/AppSidebar";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Msg { id?: string; role: "user" | "assistant"; content: string; raw?: string; pending?: boolean }
type BuildFile = { path: string; content: string };
interface BuildPreviewProps {
  files: BuildFile[];
  projectId?: string;
  streaming?: boolean;
  device?: "desktop" | "tablet" | "mobile";
  onError?: (msg: string) => void;
  onConsole?: (e: { level: string; message: string }) => void;
  onIframeReady?: (el: HTMLIFrameElement | null) => void;
}

export default function MegsyPrWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<{ id: string; name: string; published_url?: string | null; preview_url?: string | null; linked_supabase_project_ref?: string | null; linked_supabase_project_name?: string | null } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [files, setFiles] = useState<BuildFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [input, setInput] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem(`draft:${window.location.pathname}`) || ""; } catch { return ""; }
  });
  const [streaming, setStreaming] = useState(false);
  const [step, setStep] = useState<string>("");
  const [tab, setTab] = useState<"preview" | "code" | "console">("preview");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<{ level: string; message: string; t: number }[]>([]);
  const [authToken, setAuthToken] = useState<string>("");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewIframe, setPreviewIframe] = useState<HTMLIFrameElement | null>(null);
  
  const autoStartedRef = useRef(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoFixAttemptsRef = useRef<Map<string, number>>(new Map());
  const autoFixTimerRef = useRef<number | null>(null);

  // Initial load
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) setAuthToken(session.access_token);

      const { data: p } = await supabase
        .from("projects").select("id, name, published_url, preview_url, linked_supabase_project_ref, linked_supabase_project_name").eq("id", projectId).single();
      if (p) setProject(p);

      const { data: msgs } = await supabase
        .from("ai_project_messages")
        .select("id, role, content")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      setMessages(((msgs ?? []) as Msg[]).map((m) => ({
        ...m,
        raw: m.role === "assistant" ? m.content : undefined,
        content: m.role === "assistant" ? stripTags(m.content) : m.content,
      })));

      const { data: fs } = await supabase
        .from("ai_project_files")
        .select("path, content")
        .eq("project_id", projectId);
      setFiles((fs ?? []) as BuildFile[]);
      if (fs?.length) setActiveFile(fs[0].path);
      setInitialLoaded(true);
    })();
  }, [projectId]);

  // Persist draft input per project (never lose what user typed)
  useEffect(() => {
    if (!projectId) return;
    try { localStorage.setItem(`draft:${projectId}`, input); } catch { /* noop */ }
  }, [input, projectId]);

  // Restore draft when project changes
  useEffect(() => {
    if (!projectId) return;
    try {
      const saved = localStorage.getItem(`draft:${projectId}`);
      if (saved && !input) setInput(saved);
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Auto-start with prompt from URL (also fires with existing messages when autosend=1)
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    const force = searchParams.get("autosend") === "1";
    if (prompt && project && initialLoaded && !autoStartedRef.current && (messages.length === 0 || force)) {
      autoStartedRef.current = true;
      send(prompt);
      const next = new URLSearchParams(searchParams);
      next.delete("prompt");
      next.delete("autosend");
      setSearchParams(next, { replace: true });
    }
  }, [project, initialLoaded, messages.length, searchParams, setSearchParams]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  const reloadFiles = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from("ai_project_files")
      .select("path, content")
      .eq("project_id", projectId);
    setFiles((data ?? []) as BuildFile[]);
  };

  const send = async (text: string, autoFixError?: string) => {
    if (!text.trim() || streaming || !projectId) return;
    setInput("");
    setStreaming(true);
    setStep("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "", pending: true }]);

    // Snapshot current files before AI changes them (so user can rollback)
    if (files.length > 0) {
      const { data: { session: sess } } = await supabase.auth.getSession();
      const uid = sess?.user?.id;
      if (uid) {
        const filesPayload = files.map((f) => ({ path: f.path, content: f.content }));
        supabase.from("ai_project_snapshots").insert({
          project_id: projectId,
          user_id: uid,
          label: text.slice(0, 60),
          files: filesPayload as unknown as never,
          file_count: files.length,
          total_bytes: filesPayload.reduce((s, f) => s + (f.content?.length || 0), 0),
        }).then(({ error }) => { if (error) console.warn("snapshot failed:", error); });
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/build-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, message: text, auto_fix_error: autoFixError }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let assistantText = "";
      const touched = new Set<string>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (!chunk.startsWith("data:")) continue;
          const json = chunk.slice(5).trim();
          try {
            const ev = JSON.parse(json);
            if (ev.type === "step") setStep(ev.text);
            else if (ev.type === "text") {
              assistantText += ev.delta;
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = {
                    ...last,
                    raw: assistantText,
                    content: stripTags(assistantText),
                    pending: true,
                  };
                }
                return copy;
              });
            } else if (ev.type === "file") {
              touched.add(ev.path);
              const verb = ev.action === "create" || ev.action === "add" ? "إنشاء ملف" : "تعديل ملف";
              setStep(`tool:fs_write ${verb}: ${ev.path}`);
              await reloadFiles();
              if (!activeFile) setActiveFile(ev.path);
            } else if (ev.type === "warn") {
              toast.warning(ev.text);
            } else if (ev.type === "error") {
              toast.error(ev.message);
            } else if (ev.type === "done") {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = { ...last, pending: false, raw: assistantText, content: stripTags(assistantText) || "Done ✅" };
                }
                return copy;
              });
              // Sync from DB so refresh keeps the conversation
              supabase.from("ai_project_messages")
                .select("id, role, content")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true })
                .then(({ data }) => {
                  if (data) setMessages((data as Msg[]).map((m) => ({
                    ...m,
                    raw: m.role === "assistant" ? m.content : undefined,
                    content: m.role === "assistant" ? stripTags(m.content) : m.content,
                  })));
                });
              // Auto-deploy preview in background (separate URL from publish)
              deploy("preview");
            }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      toast.error(String((e as Error).message));
      setMessages((m) => m.filter((x) => !x.pending));
      setInput(text); // restore draft so user doesn't lose their message
    } finally {
      setStreaming(false);
      setStep("");
    }
  };

  const deploy = async (mode: "preview" | "publish") => {
    if (!projectId) return;
    if (mode === "publish" && publishing) return;
    if (mode === "publish") setPublishing(true);
    try {
      const prepared = await prepareProjectFilesForDeploy(projectId, files);
      if (prepared.patches.length) {
        setFiles(prepared.files);
        toast.info("تم إصلاح ملفات البناء قبل النشر");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cloudflare-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ project_id: projectId, mode }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Publish failed");
      setProject((p) => p ? {
        ...p,
        ...(mode === "publish" ? { published_url: data.url } : { preview_url: data.url }),
      } : p);
      if (mode === "publish") {
        toast.success("Published to Cloudflare ✨");
      }
    } catch (e) {
      if (mode === "publish") toast.error(String((e as Error).message));
      else console.warn("preview deploy failed:", e);
    } finally {
      if (mode === "publish") setPublishing(false);
    }
  };

  const publish = async () => {
    // Ensure publish uses the latest files by syncing a fresh preview first
    await deploy("preview");
    await deploy("publish");
  };

  const activeContent = files.find((f) => f.path === activeFile)?.content ?? "";

  const isMobile = useIsMobile();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isPreviewRoute = location.pathname.endsWith("/preview");
  const isChatRoute = location.pathname.endsWith("/chat");
  const useNewMobileViews = isMobile || isChatRoute || isPreviewRoute;

  // Default /megsy-pr/:id → redirect to /chat once project loads
  useEffect(() => {
    if (!projectId) return;
    if (!isChatRoute && !isPreviewRoute && !location.pathname.endsWith("/timeline") && !location.pathname.endsWith("/domains")) {
      navigate(`/megsy-pr/${projectId}/chat`, { replace: true });
    }
  }, [projectId, location.pathname, isChatRoute, isPreviewRoute, navigate]);

  if (useNewMobileViews) {
    return (
      <>
        {!isPreviewRoute && (
          <MobileChatView
            projectId={projectId!}
            projectName={project?.name ?? "Project"}
            messages={messages.map(m => ({ ...m })) as any}
            streaming={streaming}
            step={step}
            input={input}
            setInput={setInput}
            onSend={() => send(input)}
            onStop={() => setStreaming(false)}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
            onOpenPreview={() => navigate(`/megsy-pr/${projectId}/preview`)}
            onProjectRenamed={(name) => setProject(p => p ? { ...p, name } : p)}
            onAction={(id) => {
              if (id === "publish") navigate(`/megsy-pr/${projectId}/preview`);
              else if (id === "history") navigate(`/megsy-pr/${projectId}/timeline`);
              else toast(`${id} — coming in phase 2`);
            }}
          />
        )}
        {isPreviewRoute && (
          <MobilePreviewView
            projectId={projectId!}
            projectName={project?.name ?? "Project"}
            files={files}
            previewUrl={project?.preview_url}
            publishedUrl={project?.published_url}
            hasUnpublishedChanges={!!project?.preview_url && project?.preview_url !== project?.published_url}
            onPublished={(url) => setProject((p) => p ? { ...p, published_url: url } : p)}
            step={step}
            streaming={streaming}
            onIframeReady={setPreviewIframe}
          />
        )}
        <AppSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onNewChat={() => navigate("/chat")}
          currentMode="megsy-pr"
        />
      </>
    );
  }

  return (
    <>
    <AppSidebar
      open={mobileSidebarOpen}
      onClose={() => setMobileSidebarOpen(false)}
      onNewChat={() => navigate("/chat")}
      currentMode="megsy-pr"
    />
    <div className="flex h-[100dvh] w-full ios26-bg text-foreground flex-col">
      {/* Top bar */}
      <header className="shrink-0 mx-2 mt-2 h-14 px-3 flex items-center gap-3 ios26-glass-strong rounded-2xl">
        <button onClick={() => setMobileSidebarOpen(true)} className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center transition" title="Menu">
          <Menu className="w-4 h-4" />
        </button>
        <button onClick={() => navigate("/megsy-pr")} className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center transition" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{project?.name ?? "..."}</p>
          {step && <p className="text-xs text-muted-foreground truncate">{step}</p>}
        </div>
        <div className="hidden sm:flex items-center gap-1 ios26-glass rounded-full p-1">
          <button onClick={() => setTab("preview")} className={`ios26-chip ${tab==="preview"?"ios26-chip--active":""}`}>
            <Eye className="w-3.5 h-3.5 inline me-1" /> Preview
          </button>
          <button onClick={() => setTab("code")} className={`ios26-chip ${tab==="code"?"ios26-chip--active":""}`}>
            <Code2 className="w-3.5 h-3.5 inline me-1" /> Code
          </button>
          <button onClick={() => setTab("console")} className={`ios26-chip relative ${tab==="console"?"ios26-chip--active":""}`}>
            Console
            {consoleEntries.filter(e => e.level === "error").length > 0 && (
              <span className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 grid place-items-center">
                {consoleEntries.filter(e => e.level === "error").length}
              </span>
            )}
          </button>
        </div>
        {project?.preview_url && (
          <a href={project.preview_url} target="_blank" rel="noreferrer" className="hidden md:inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400" title="Preview URL">
            <Eye className="w-3 h-3" /> Preview
          </a>
        )}
        {project?.published_url && (
          <a href={project.published_url} target="_blank" rel="noreferrer" className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" title="Published site">
            <ExternalLink className="w-3 h-3" /> Published
          </a>
        )}
        {projectId && <AssetUploader projectId={projectId} />}
        {projectId && <GitHubPanel projectId={projectId} projectName={project?.name} files={files} onImported={reloadFiles} />}
        {projectId && <SnapshotsPanel projectId={projectId} onRestored={reloadFiles} />}
        {projectId && <CostDashboard projectId={projectId} />}
        {projectId && <SelfTestButton projectId={projectId} />}
        {projectId && <IndexFilesButton projectId={projectId} />}
        {projectId && <VisitsPanel projectId={projectId} />}
        {projectId && <VisualEditorToggle iframe={previewIframe} onPicked={(inst) => send(inst)} />}
        {projectId && (
          <SupabaseConnectionPanel
            projectId={projectId}
            linkedProjectName={project?.linked_supabase_project_name}
            linkedProjectRef={project?.linked_supabase_project_ref}
            onChange={async () => {
              const { data: p } = await supabase
                .from("projects")
                .select("id, name, published_url, preview_url, linked_supabase_project_ref, linked_supabase_project_name")
                .eq("id", projectId).single();
              if (p) setProject(p);
            }}
          />
        )}
        {projectId && (
          <button
            onClick={() => navigate(`/megsy-pr/${projectId}/domains`)}
            className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
            title="Custom domain"
          >
            <Globe className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={publish}
          disabled={publishing || streaming || files.length === 0}
          className="ios26-button inline-flex items-center gap-1.5 h-9 px-4 text-xs"
        >
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
          {project?.published_url ? "Update deployment" : "Publish"}
        </button>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-2 p-2 pt-2">
        {/* Chat panel */}
        <aside className="ios26-glass rounded-2xl flex flex-col min-h-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streaming && (
              <div className="text-center text-muted-foreground/60 text-sm py-12">
                <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                Start by typing your idea
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "text-end" : ""}`}>
                <div className={`inline-block px-4 py-2.5 rounded-2xl max-w-[90%] whitespace-pre-wrap break-words ${
                  m.role === "user"
                    ? "ios26-button text-primary-foreground"
                    : "ios26-glass-strong text-foreground"
                }`} dir="auto">
                  {m.content || (m.pending ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "")}
                </div>
                {m.role === "assistant" && m.raw && !m.pending && (
                  <div className="mt-1">
                    <ChangedFilesPill rawContent={m.raw} prevFiles={new Map(files.map((f) => [f.path, f.content]))} />
                  </div>
                )}
              </div>
            ))}
            {streaming && step && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 px-2">
                <Loader2 className="w-3 h-3 animate-spin" /> {step}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-foreground/5">
            <div className="ios26-glass-strong rounded-2xl p-2 ps-3 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask for an edit or a new feature…"
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm placeholder:text-muted-foreground/50 outline-none py-2 max-h-32"
                dir="auto"
                disabled={streaming}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                className="ios26-button shrink-0 w-9 h-9 grid place-items-center rounded-xl"
              >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Preview / Code / Console */}
        <main className="min-h-0 ios26-glass rounded-2xl overflow-hidden relative">
          {tab === "preview" && (
            <>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 ios26-glass-strong rounded-full p-1">
                {([
                  ["desktop", Monitor, "Desktop"],
                  ["tablet", Tablet, "Tablet"],
                  ["mobile", Smartphone, "Mobile"],
                ] as const).map(([dev, Icon, label]) => (
                  <button
                    key={dev}
                    onClick={() => setPreviewDevice(dev)}
                    title={label}
                    className={`w-8 h-8 rounded-full grid place-items-center transition ${
                      previewDevice === dev ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <BuildPreview
                files={files}
                projectId={projectId}
                streaming={streaming}
                device={previewDevice}
                onError={(msg) => {
                  const errorMessage = formatPreviewMessage(msg);
                  setPreviewError(errorMessage);
                  setConsoleEntries((c) => [...c.slice(-99), { level: "error", message: errorMessage, t: Date.now() }]);
                  // debounced auto-fix
                  if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
                  autoFixTimerRef.current = window.setTimeout(() => {
                    if (streaming) return;
                    const key = errorMessage.slice(0, 100);
                    const tries = autoFixAttemptsRef.current.get(key) ?? 0;
                    if (tries >= 3) return;
                    autoFixAttemptsRef.current.set(key, tries + 1);
                    send(`Fix this error`, errorMessage);
                    setPreviewError(null);
                  }, 1800);
                }}
                onConsole={(e) => setConsoleEntries((c) => [...c.slice(-99), { ...e, t: Date.now() }])}
                onIframeReady={setPreviewIframe}
              />
              {previewError && !streaming && (
                <div className="absolute bottom-3 inset-x-3 rounded-xl bg-destructive/95 text-destructive-foreground p-3 shadow-lg flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5">Preview error — fixing…</p>
                    <p className="text-[11px] opacity-90 truncate" dir="ltr">{previewError}</p>
                  </div>
                  <button
                    onClick={() => { send(`Fix this error`, previewError); setPreviewError(null); }}
                    className="shrink-0 h-8 px-3 rounded-lg bg-white text-destructive text-xs font-semibold hover:bg-white/90"
                  >
                    Fix now
                  </button>
                  <button onClick={() => setPreviewError(null)} className="shrink-0 w-7 h-7 rounded-md hover:bg-white/10 grid place-items-center">
                    ✕
                  </button>
                </div>
              )}
            </>
          )}
          {tab === "code" && (
            <div className="h-full grid grid-cols-[200px_1fr]">
              <div className="border-l border-border/50 overflow-y-auto bg-background">
                {files.length === 0 && (
                  <div className="p-4 text-xs text-muted-foreground/60">No files yet</div>
                )}
                {files.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`w-full text-start px-3 py-2 text-xs flex items-center gap-2 hover:bg-accent ${
                      activeFile === f.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate" dir="ltr">{f.path}</span>
                  </button>
                ))}
              </div>
              {activeFile ? (
                <CodeEditor
                  projectId={projectId!}
                  path={activeFile}
                  initialContent={activeContent}
                  onSaved={(p, c) => setFiles((fs) => fs.map((f) => f.path === p ? { ...f, content: c } : f))}
                />
              ) : (
                <div className="grid place-items-center text-xs text-muted-foreground/60 bg-zinc-950">Select files to edit</div>
              )}
            </div>
          )}
          {tab === "console" && (
            <div className="h-full bg-zinc-950 text-zinc-200 overflow-auto font-mono text-xs">
              <div className="sticky top-0 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-3 py-2 flex items-center justify-between">
                <span className="text-zinc-400">Runtime console ({consoleEntries.length})</span>
                <button onClick={() => setConsoleEntries([])} className="text-zinc-500 hover:text-zinc-200">Clear</button>
              </div>
              {consoleEntries.length === 0 && (
                <div className="p-6 text-center text-zinc-500">No logs yet</div>
              )}
              {consoleEntries.map((e, i) => (
                <div key={i} className={`px-3 py-1.5 border-b border-zinc-900 whitespace-pre-wrap break-all ${
                  e.level === "error" ? "text-red-400" : e.level === "warn" ? "text-amber-400" : "text-zinc-300"
                }`} dir="ltr">
                  <span className="text-zinc-600 me-2">[{e.level}]</span>{e.message}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}

/* ============================================================================
 * SnapshotsPanel — snapshots list + restore
 * ========================================================================== */
interface Snapshot {
  id: string;
  label: string | null;
  file_count: number;
  total_bytes: number;
  created_at: string;
}

function SnapshotsPanel({
  projectId,
  onRestored,
}: {
  projectId: string;
  onRestored?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_project_snapshots")
      .select("id, label, file_count, total_bytes, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Snapshot[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  const restore = async (snap: Snapshot) => {
    if (!confirm(`Restore this version (${snap.file_count} files)? Current files will be overwritten.`)) return;
    setRestoring(snap.id);
    try {
      const { data, error } = await supabase
        .from("ai_project_snapshots")
        .select("files")
        .eq("id", snap.id)
        .single();
      if (error) throw error;
      const files = (data?.files as Array<{ path: string; content: string }>) ?? [];
      // Wipe + rewrite project files
      await supabase.from("ai_project_files").delete().eq("project_id", projectId);
      if (files.length) {
        const rows = files.map((f) => ({ project_id: projectId, path: f.path, content: f.content }));
        const { error: insErr } = await supabase.from("ai_project_files").insert(rows);
        if (insErr) throw insErr;
      }
      toast.success("Restored successfully");
      onRestored?.();
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
        title="Previous versions"
      >
        <History className="w-4 h-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="ios26-glass-strong rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-foreground/10">
              <div className="flex items-center gap-2 font-medium text-sm">
                <History className="w-4 h-4" /> Previous versions
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading && <div className="text-center text-xs text-muted-foreground py-6"><Loader2 className="w-4 h-4 animate-spin inline mx-1" /> Loading...</div>}
              {!loading && !items.length && <div className="text-center text-xs text-muted-foreground py-6">No previous versions yet</div>}
              {items.map((s) => (
                <div key={s.id} className="ios26-glass rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate" dir="auto">{s.label || "Automatic version"}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(s.created_at).toLocaleString("ar-EG")} · {s.file_count} files · {(s.total_bytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => restore(s)}
                    disabled={restoring === s.id}
                    className="ios26-button h-8 px-3 text-xs inline-flex items-center gap-1"
                  >
                    {restoring === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================================
 * CostDashboard — Total MC used
 * ========================================================================== */
interface UsageRow {
  action: string | null;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  mc_cost: number | null;
  duration_ms: number | null;
  created_at: string;
}

function CostDashboard({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_project_usage")
      .select("action, model, prompt_tokens, completion_tokens, mc_cost, duration_ms, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as UsageRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  const totals = useMemo(() => {
    const mc = rows.reduce((a, r) => a + Number(r.mc_cost ?? 0), 0);
    const tokens = rows.reduce((a, r) => a + (r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0), 0);
    const calls = rows.length;
    const avgMs = calls ? rows.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / calls : 0;
    return { mc, tokens, calls, avgMs };
  }, [rows]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
        title="MC usage"
      >
        <DollarSign className="w-4 h-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="ios26-glass-strong rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-foreground/10">
              <div className="flex items-center gap-2 font-medium text-sm">
                <DollarSign className="w-4 h-4" /> Project usage
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
              <Stat label="Total MC" value={totals.mc.toFixed(2)} />
              <Stat label="Calls" value={totals.calls.toString()} />
              <Stat label="Total tokens" value={totals.tokens.toLocaleString()} />
              <Stat label="Avg time" value={`${(totals.avgMs / 1000).toFixed(1)}s`} />
            </div>

            <div className="flex-1 overflow-y-auto p-3 pt-0">
              {loading && <div className="text-center text-xs text-muted-foreground py-6"><Loader2 className="w-4 h-4 animate-spin inline mx-1" /> Loading...</div>}
              {!loading && !rows.length && <div className="text-center text-xs text-muted-foreground py-6">No usage data yet</div>}
              {rows.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-start px-2 py-1.5 font-normal">Operation</th>
                      <th className="text-start px-2 py-1.5 font-normal">Model</th>
                      <th className="text-end px-2 py-1.5 font-normal">Tokens</th>
                      <th className="text-end px-2 py-1.5 font-normal">MC</th>
                      <th className="text-end px-2 py-1.5 font-normal">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-foreground/5">
                        <td className="px-2 py-1.5">{r.action || "-"}</td>
                        <td className="px-2 py-1.5 truncate max-w-[160px]">{r.model || "-"}</td>
                        <td className="px-2 py-1.5 text-end">{((r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0)).toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-end">{Number(r.mc_cost ?? 0).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-end text-muted-foreground">{((r.duration_ms ?? 0) / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios26-glass rounded-xl p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

/* ============================================================================
 * ChangedFilesPill — Diff viewer (red/green) for files changed in the AI response
 * ========================================================================== */
interface ParsedFile { path: string; content: string }

function parseFilesFromRaw(raw: string): ParsedFile[] {
  const out: ParsedFile[] = [];
  const re = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push({ path: m[1], content: m[2].replace(/^\n/, "").replace(/\n$/, "") });
  }
  return out;
}

interface DiffLine { type: "add" | "del" | "ctx"; text: string }

function lineDiff(prev: string, next: string): DiffLine[] {
  const a = prev.split("\n");
  const b = next.split("\n");
  // Simple LCS-based diff (n*m, ok for small files in chat)
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: "ctx", text: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", text: a[i] }); i++; }
    else { out.push({ type: "add", text: b[j] }); j++; }
  }
  while (i < n) out.push({ type: "del", text: a[i++] });
  while (j < m) out.push({ type: "add", text: b[j++] });
  return out;
}

function ChangedFilesPill({
  rawContent,
  prevFiles,
}: {
  rawContent: string;
  prevFiles: Map<string, string>;
}) {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const changed = useMemo(() => parseFilesFromRaw(rawContent), [rawContent]);

  const diffForOpen = useMemo(() => {
    if (!openPath) return [];
    const next = changed.find((f) => f.path === openPath)?.content ?? "";
    const prev = prevFiles.get(openPath) ?? "";
    return lineDiff(prev, next);
  }, [openPath, changed, prevFiles]);

  const adds = diffForOpen.filter((l) => l.type === "add").length;
  const dels = diffForOpen.filter((l) => l.type === "del").length;

  if (!changed.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {changed.map((f) => {
          const existed = prevFiles.has(f.path);
          return (
            <button
              key={f.path}
              onClick={() => setOpenPath(f.path)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg ios26-glass hover:bg-foreground/10 transition"
              title="Show diff"
            >
              <FileDiff className="w-3 h-3" />
              <span className="font-mono">{f.path}</span>
              <span className={`text-[10px] ${existed ? "text-amber-500" : "text-emerald-500"}`}>
                {existed ? "Edit" : "New"}
              </span>
            </button>
          );
        })}
      </div>

      {openPath && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => setOpenPath(null)}>
          <div className="ios26-glass-strong rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-3 border-b border-foreground/10">
              <div className="flex items-center gap-2 text-xs">
                <FileDiff className="w-4 h-4" />
                <span className="font-mono">{openPath}</span>
                <span className="text-emerald-500">+{adds}</span>
                <span className="text-rose-500">−{dels}</span>
              </div>
              <button onClick={() => setOpenPath(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed">
              {diffForOpen.map((l, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-0.5 whitespace-pre ${
                    l.type === "add"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : l.type === "del"
                      ? "bg-rose-500/15 text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="opacity-60 me-2">{l.type === "add" ? "+" : l.type === "del" ? "−" : " "}</span>
                  {l.text || " "}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================================
 * VisualEditorToggle — click→edit mode for the preview iframe
 * ========================================================================== */
function VisualEditorToggle({
  iframe,
  onPicked,
}: {
  iframe: HTMLIFrameElement | null;
  onPicked: (instruction: string) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [picked, setPicked] = useState<{ selector: string; text: string; tag: string } | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    iframe?.contentWindow?.postMessage({ __lov_visual_edit: true, enabled }, "*");
  }, [enabled, iframe]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.__lov_visual_pick) {
        setPicked({ selector: d.selector, text: d.text, tag: d.tag });
        setDraft(d.text || "");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const submit = () => {
    if (!picked) return;
    const inst = `On element ${picked.tag} (${picked.selector}) whose current text is:\n"${picked.text}"\n\nApply the following edit:\n${draft}`;
    onPicked(inst);
    setPicked(null);
    setEnabled(false);
  };

  return (
    <>
      <button
        onClick={() => setEnabled((v) => !v)}
        className={`h-9 w-9 rounded-xl grid place-items-center transition ${
          enabled ? "bg-primary text-primary-foreground" : "hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
        }`}
        title="Visual editor (click to edit)"
      >
        <MousePointerClick className="w-4 h-4" />
      </button>
      {picked && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => setPicked(null)}>
          <div className="ios26-glass-strong rounded-2xl w-full max-w-md p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Edit element</div>
              <button onClick={() => setPicked(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono truncate">{picked.selector}</div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              dir="auto"
              placeholder="Describe the change you want…"
              className="w-full bg-transparent ios26-glass rounded-xl p-3 text-sm outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPicked(null)} className="text-xs text-muted-foreground px-3 h-8">Cancel</button>
              <button onClick={submit} disabled={!draft.trim()} className="ios26-button h-8 px-3 text-xs">Send to AI</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================================
 * SelfTestButton — runs the self-test edge function and shows a report
 * ========================================================================== */
function SelfTestButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("project-self-test", { body: { projectId } });
      if (error) throw error;
      setReport(data);
      if (data.ok) toast.success("Scan completed successfully");
      else toast.warning(`${data.errors || 0} errors, ${data.warnings || 0} warnings`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); run(); }}
        className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
        title="Project self-check"
      >
        <ShieldCheck className="w-4 h-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="ios26-glass-strong rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-foreground/10">
              <div className="flex items-center gap-2 font-medium text-sm">
                <ShieldCheck className="w-4 h-4" /> Self-check
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && <div className="text-center text-xs text-muted-foreground py-6"><Loader2 className="w-4 h-4 animate-spin inline mx-1" /> Scanning…</div>}
              {!loading && report && (
                <>
                  <div className={`flex items-center gap-2 text-sm ${report.ok ? "text-emerald-500" : "text-amber-500"}`}>
                    {report.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {report.ok ? "Everything works" : `${report.errors || 0} errors, ${report.warnings || 0} warnings`}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Files: {report.fileCount} · Bundle: {report.bundleOk ? "OK" : "FAIL"}
                  </div>
                  <div className="space-y-1.5 pt-2">
                    {(report.issues || []).map((i: any, idx: number) => (
                      <div key={idx} className={`text-[11px] p-2 rounded-lg ${
                        i.level === "error" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {i.file && <span className="font-mono opacity-70">{i.file}: </span>}
                        {i.message}
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button onClick={run} disabled={loading} className="ios26-button w-full h-8 text-xs mt-3">Re-scan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================================
 * IndexFilesButton — generate vector embeddings for project files
 * ========================================================================== */
function IndexFilesButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("index-project-files", { body: { projectId, force: false } });
      if (error) throw error;
      toast.success(`Indexed ${data.indexed} files${data.failed ? ` (${data.failed} failed)` : ""}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={run}
      disabled={loading}
      className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
      title="Index files (Smart context)"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
    </button>
  );
}

/* ============================================================================
 * VisitsPanel — visitor analytics
 * ========================================================================== */
interface Visit { path: string; referrer: string | null; country: string | null; ua_hash: string | null; created_at: string }

function VisitsPanel({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_visits")
      .select("path, referrer, country, ua_hash, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Visit[]);
    setLoading(false);
  };

  useEffect(() => { if (open) load();   }, [open, projectId]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = rows.filter((r) => new Date(r.created_at) >= today).length;
    const uniques = new Set(rows.map((r) => r.ua_hash)).size;
    const topPaths = Object.entries(
      rows.reduce<Record<string, number>>((a, r) => { a[r.path] = (a[r.path] ?? 0) + 1; return a; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total: rows.length, todayCount, uniques, topPaths };
  }, [rows]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
        title="Visitor analytics"
      >
        <BarChart3 className="w-4 h-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="ios26-glass-strong rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-foreground/10">
              <div className="flex items-center gap-2 font-medium text-sm">
                <BarChart3 className="w-4 h-4" /> Visitor analytics
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </header>
            <div className="grid grid-cols-3 gap-2 p-4">
              <Stat label="Total visits" value={stats.total.toString()} />
              <Stat label="Today" value={stats.todayCount.toString()} />
              <Stat label="Unique visitors" value={stats.uniques.toString()} />
            </div>
            {stats.topPaths.length > 0 && (
              <div className="px-4 pb-2">
                <div className="text-[11px] text-muted-foreground mb-1.5">Most visited pages</div>
                <div className="space-y-1">
                  {stats.topPaths.map(([p, n]) => (
                    <div key={p} className="flex items-center justify-between text-xs ios26-glass rounded-lg px-2 py-1.5">
                      <span className="font-mono truncate">{p}</span>
                      <span className="text-muted-foreground">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-3 pt-0">
              {loading && <div className="text-center text-xs text-muted-foreground py-6"><Loader2 className="w-4 h-4 animate-spin inline mx-1" /> Loading…</div>}
              {!loading && !rows.length && <div className="text-center text-xs text-muted-foreground py-6">No visits yet. Add tracking to the published site.</div>}
              {rows.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-start px-2 py-1.5 font-normal">Time</th>
                      <th className="text-start px-2 py-1.5 font-normal">Page</th>
                      <th className="text-start px-2 py-1.5 font-normal">Source</th>
                      <th className="text-start px-2 py-1.5 font-normal">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-t border-foreground/5">
                        <td className="px-2 py-1.5 text-muted-foreground">{new Date(r.created_at).toLocaleString("ar-EG")}</td>
                        <td className="px-2 py-1.5 font-mono truncate max-w-[140px]">{r.path}</td>
                        <td className="px-2 py-1.5 truncate max-w-[140px]">{r.referrer || "-"}</td>
                        <td className="px-2 py-1.5">{r.country || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CodeEditorProps {
  projectId: string;
  path: string;
  initialContent: string;
  onSaved?: (path: string, content: string) => void;
}

function CodeEditor({ projectId, path, initialContent, onSaved }: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setContent(initialContent);
    setDirty(false);
  }, [path, initialContent]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("ai_project_files")
        .upsert({ project_id: projectId, path, content }, { onConflict: "project_id,path" });
      if (error) throw error;
      onSaved?.(path, content);
      setDirty(false);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 text-xs">
        <span className="font-mono text-zinc-400 truncate" dir="ltr">{path}</span>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true); }}
        className="flex-1 w-full bg-zinc-950 text-zinc-100 p-3 font-mono text-xs resize-none outline-none"
        spellCheck={false}
        dir="ltr"
      />
    </div>
  );
}

interface VersionRecord {
  id: string;
  created_at: string;
  message?: string | null;
}

function VersionHistory({ projectId, onRestored }: { projectId: string; onRestored?: () => void }) {
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("project_versions")
        .select("id, created_at, message")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);
      setVersions((data as VersionRecord[]) || []);
    })();
  }, [open, projectId]);

  const restore = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("restore-version", {
        body: { projectId, versionId: id },
      });
      if (error) throw error;
      toast.success("Version restored");
      onRestored?.();
    } catch (e: any) {
      toast.error(e.message || "Restore failed");
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent"
      >
        <span className="flex items-center gap-2"><History className="w-3.5 h-3.5" /> Version history</span>
        <span className="text-muted-foreground">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="border-t border-border/50 max-h-64 overflow-y-auto">
          {versions.length === 0 && <div className="p-3 text-xs text-muted-foreground">No versions</div>}
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2 border-b border-border/30 text-[11px]">
              <div className="min-w-0">
                <div className="truncate text-foreground/80">{v.message || "No description"}</div>
                <div className="text-muted-foreground" dir="ltr">{new Date(v.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => restore(v.id)} className="shrink-0 p-1.5 rounded-md hover:bg-accent" title="Restore">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetUploader({ projectId }: { projectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !selectedFiles.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const assetPath = `${projectId}/assets/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from("project-assets").upload(assetPath, file, { upsert: true });
        if (error) throw error;
      }
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-2">
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-accent disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload assets
      </button>
    </div>
  );
}

interface GitHubPanelProps {
  projectId: string;
  projectName?: string;
  files: BuildFile[];
  onImported?: () => void;
}

function GitHubPanel({ projectId, projectName, files, onImported }: GitHubPanelProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"push" | "import" | null>(null);
  const [repo, setRepo] = useState("");

  const push = async () => {
    if (files.length === 0) return toast.error("No files to upload");
    setBusy("push");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const filesObj: Record<string, string> = {};
      files.forEach((f) => { filesObj[f.path] = f.content; });
      const { data, error } = await supabase.functions.invoke("github-push", {
        body: { user_id: user.id, project_name: projectName || "megsy-app", description: "Built with Megsy AI", files: filesObj },
      });
      if (error) throw error;
      toast.success("Uploaded successfully", { description: data?.repo_url, action: data?.repo_url ? { label: "Open", onClick: () => window.open(data.repo_url, "_blank") } : undefined });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(null); }
  };

  const importRepo = async () => {
    const m = repo.trim().match(/^(?:https?:\/\/github\.com\/)?([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/);
    if (!m) return toast.error("Invalid repo format (owner/repo)");
    setBusy("import");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase.functions.invoke("github-import", {
        body: { user_id: user.id, project_id: projectId, repo: `${m[1]}/${m[2]}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Imported ${data?.imported ?? 0} files`);
      setOpen(false); setRepo("");
      onImported?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally { setBusy(null); }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 rounded-xl hover:bg-foreground/10 grid place-items-center text-muted-foreground hover:text-foreground transition"
        title="GitHub"
      >
        <Github className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute end-0 top-11 z-50 ios26-glass-strong rounded-2xl p-3 w-72 shadow-2xl space-y-2">
          <button
            onClick={push}
            disabled={!!busy}
            className="w-full ios26-button inline-flex items-center justify-center gap-2 h-9 text-xs disabled:opacity-50"
          >
            {busy === "push" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Push project to GitHub
          </button>
          <div className="pt-2 border-t border-foreground/10 space-y-2">
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo or GitHub URL"
              dir="ltr"
              className="w-full ios26-glass rounded-xl px-3 py-2 text-xs outline-none"
            />
            <button
              onClick={importRepo}
              disabled={!!busy || !repo.trim()}
              className="w-full ios26-glass-strong inline-flex items-center justify-center gap-2 h-9 text-xs rounded-xl disabled:opacity-50"
            >
              {busy === "import" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Import a repo as a starting point
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



interface Props {
  projectId: string;
  linkedProjectName?: string | null;
  linkedProjectRef?: string | null;
  onChange: () => void;
}

type SbProject = { id: string; name: string; region: string; organization_id: string };

function SupabaseConnectionPanel({ projectId, linkedProjectName, linkedProjectRef, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<SbProject[] | null>(null);
  const [loading, setLoading] = useState(false);

  const callApi = async (action: string, body: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sign in first");
    const r = await fetch(`${SUPABASE_URL}/functions/v1/supabase-link-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const checkStatus = async () => {
    try { const r = await callApi("status"); setConnected(r.connected); }
    catch { setConnected(false); }
  };

  useEffect(() => { if (open) checkStatus(); }, [open]);

  const startOAuth = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/supabase-oauth-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const popup = window.open(data.authorize_url, "supabase-oauth", "width=600,height=750");
      const listener = (ev: MessageEvent) => {
        if (ev.data?.type === "supabase-oauth") {
          window.removeEventListener("message", listener);
          if (ev.data.ok) {
            toast.success("Supabase account linked");
            checkStatus();
          } else toast.error("Failed to link Supabase account");
        }
      };
      window.addEventListener("message", listener);
      // Fallback polling in case popup closes without postMessage
      const t = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(t);
          await checkStatus();
        }
      }, 1500);
    } catch (e) { toast.error(String((e as Error).message)); }
    finally { setLoading(false); }
  };

  const loadProjects = async () => {
    setLoading(true);
    try { const r = await callApi("list_projects"); setProjects(r.projects); }
    catch (e) { toast.error(String((e as Error).message)); }
    finally { setLoading(false); }
  };

  const linkProject = async (p: SbProject) => {
    setLoading(true);
    try {
      await callApi("link_project", { project_id: projectId, ref: p.id, name: p.name });
      toast.success(`Linked to ${p.name}`);
      onChange();
      setOpen(false);
    } catch (e) { toast.error(String((e as Error).message)); }
    finally { setLoading(false); }
  };

  const unlink = async () => {
    if (!confirm("Unlink? Your current code won't be deleted, but it won't be able to modify your database.")) return;
    setLoading(true);
    try { await callApi("unlink_project", { project_id: projectId }); onChange(); toast.success("Unlinked"); }
    catch (e) { toast.error(String((e as Error).message)); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`h-9 px-3 rounded-xl grid place-items-center transition inline-flex items-center gap-1.5 text-xs ${
          linkedProjectRef
            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
            : "hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
        }`}
        title={linkedProjectName ? `Supabase: ${linkedProjectName}` : "Connect Supabase"}
      >
        <Database className="w-4 h-4" />
        <span className="hidden md:inline">{linkedProjectName ? linkedProjectName : "Supabase"}</span>
        {linkedProjectRef && <Check className="w-3 h-3" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="ios26-glass-strong rounded-2xl max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold flex-1">Connect Supabase</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">Close</button>
            </div>

            {connected === null && <div className="py-6 grid place-items-center"><Loader2 className="w-5 h-5 animate-spin opacity-50" /></div>}

            {connected === false && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Link your Supabase account so the AI can create tables and a database on your account directly.
                </p>
                <button
                  onClick={startOAuth}
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium inline-flex items-center justify-center gap-2 transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  Link Supabase account
                </button>
              </div>
            )}

            {connected === true && (
              <div className="space-y-3">
                {linkedProjectName ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Linked project:</p>
                    <p className="font-medium text-emerald-400">{linkedProjectName}</p>
                    <button onClick={unlink} disabled={loading} className="mt-2 text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                      <Unlink className="w-3 h-3" /> Unlink
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Choose a Supabase project to link to this build project:</p>
                )}

                {!projects && (
                  <button onClick={loadProjects} disabled={loading} className="w-full h-10 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-sm inline-flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Show projects"}
                  </button>
                )}

                {projects && (
                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {projects.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No projects. Create one at dashboard.supabase.com</p>}
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => linkProject(p)}
                        disabled={loading || p.id === linkedProjectRef}
                        className="w-full text-start p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.region} · {p.id}</p>
                        </div>
                        {p.id === linkedProjectRef && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BuildPreview({ files, projectId, streaming, device = "desktop", onError, onConsole, onIframeReady }: BuildPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const lastHashRef = useRef<string>("");

  useEffect(() => { onIframeReady?.(iframeRef.current); }, [onIframeReady, html]);

  useEffect(() => {
    if (!files.length || !projectId) return;
    const hash = files.map((f) => `${f.path}:${f.content?.length || 0}`).join("|");
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    // Streaming → rebuild faster (every new file). Idle → keep batched 600ms.
    const delay = streaming ? 200 : 600;

    const debounce = window.setTimeout(async () => {
      setLoading(true);
      try {
        const filesObj: Record<string, string> = {};
        for (const f of files) filesObj[f.path] = f.content;
        const { data, error } = await supabase.functions.invoke("bundle-preview-fast", {
          body: { projectId, files: filesObj },
        });
        if (error) throw new Error(error.message);
        if (data?.html) setHtml(data.html);
        else if (data?.error) {
          onError?.(data.error);
          setHtml(`<pre style="padding:20px;color:#ef4444;font-family:monospace;font-size:12px;white-space:pre-wrap">${data.error}</pre>`);
        }
      } catch (e) {
        onError?.((e as Error).message || "Preview error");
      } finally {
        setLoading(false);
      }
    }, delay);
    return () => window.clearTimeout(debounce);
  }, [files, projectId, streaming, onError]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      const payload = e.data as Record<string, unknown>;
      if (payload.__lov_console) {
        onConsole?.({
          level: typeof payload.level === "string" ? payload.level : "log",
          message: formatPreviewMessage(Array.isArray(payload.args) ? payload.args.join(" ") : payload.message),
        });
      }
      if (payload.__lov_error) onError?.(formatPreviewMessage(payload.message ?? payload.stack ?? payload.__lov_error));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onConsole, onError]);

  if (!files.length) {
    return (
      <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">
        Start the chat to generate the project
      </div>
    );
  }

  const frameSize =
    device === "mobile" ? { w: 390, h: 844 } :
    device === "tablet" ? { w: 820, h: 1180 } : null;

  return (
    <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-900 grid place-items-center overflow-auto">
      {loading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 border border-border text-xs">
          <Loader2 className="w-3 h-3 animate-spin" /> Updating…
        </div>
      )}
      <div
        className={frameSize ? "rounded-[2rem] border-[10px] border-neutral-800 shadow-2xl bg-white overflow-hidden my-6" : "w-full h-full"}
        style={frameSize ? { width: frameSize.w, height: frameSize.h, maxWidth: "100%", maxHeight: "100%" } : undefined}
      >
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          title="preview"
        />
      </div>
    </div>
  );
}

// Hide our inline tags from the chat bubble — show only the prose around them.
function stripTags(s: string): string {
  return s
    .replace(/<lov-write[\s\S]*?<\/lov-write>/g, "")
    .replace(/<lov-edit[\s\S]*?<\/lov-edit>/g, "")
    .replace(/<lov-delete[^>]*\/?>/g, "")
    .replace(/<lov-step>([\s\S]*?)<\/lov-step>/g, "")
    // Keep inner text of thinking/plan/step so the assistant bubble isn't empty.
    .replace(/<\/?(thinking|think|plan|step|files)>/g, "")
    .replace(/<tool[\s\S]*?<\/tool[^>]*>/g, "")
    .replace(/<sql>[\s\S]*?<\/sql>/g, "")
    .replace(/<migration>[\s\S]*?<\/migration>/g, "")
    .replace(/<file[\s\S]*?<\/file>/g, "")
    .replace(/<code>[\s\S]*?<\/code>/g, "")
    .replace(/<edge-function[\s\S]*?<\/edge-function>/g, "")
    .replace(/<done\s*\/?>/g, "")
    .replace(/<\/?(sql|migration|file|code|edge-function|done|tool|lov-[a-z-]+)\b[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatPreviewMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (value == null) return "Preview error";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
