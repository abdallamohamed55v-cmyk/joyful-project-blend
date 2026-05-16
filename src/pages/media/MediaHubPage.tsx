import { useState, useEffect, useRef, type CSSProperties } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AppSidebar from "@/components/layout/AppSidebar";
import ModelPickerSheet from "@/components/model-picker/ModelPickerSheet";
import type { ModelOption } from "@/components/model-picker/ModelSelector";
import { supabase } from "@/integrations/supabase/client";
import type { ShowcaseItem } from "@/components/showcase/ShowcaseGrid";
import { useDynamicModels } from "@/hooks/useModels";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { Loader2, Check, ImagePlus as ImagePlusIcon } from "lucide-react";
import AnimatedHeadline from "@/components/research/AnimatedHeadline";
import {
  DEMO_IMAGE_TEMPLATES,
  DEMO_VIDEO_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from "@/data/mediaTemplates";

// iOS-style icon: photo with a + badge
import {
  MenuIcon,
  PlusIcon,
  CloseIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  
  GridHomeIcon,
  WandStudioIcon,
  CompassIcon,
  SettingsGearIcon,
  ToolBrushIcon,
  ToolShirtIcon,
  ToolPersonIcon,
  ToolFacesIcon,
  ToolEraseIcon,
  ToolPaletteIcon,
  ToolSparklesIcon,
  ToolScissorsIcon,
  ToolPencilIcon,
  ToolBulbIcon,
  ToolMaskIcon,
  ToolFilmIcon,
  ToolHairIcon,
  ToolAvatarIcon,
  ToolBoxIcon,
  ToolLogoIcon,
  ToolPerspectiveIcon,
  ToolMicIcon,
  ToolUpscaleIcon,
  ToolCaptionIcon,
  ToolExtendIcon,
  ToolGreenScreenIcon,
  ToolWatermarkIcon,
  ToolNoiseIcon,
  ToolThumbIcon,
  ToolGridIcon,
} from "@/components/media/MediaIcons";

type Mode = "image" | "video";
type Tab = "home" | "studio" | "community";
type IconCmp = (p: { className?: string; strokeWidth?: number }) => JSX.Element;

const NANO_BANANA_DEFAULT: ModelOption = {
  id: "nano-banana",
  name: "Nano Banana",
  credits: "1",
  iconUrl: "/model-logos/nano-banana.jpg",
};
const HAILUO_DEFAULT: ModelOption = {
  id: "hailuo-2.3",
  name: "Hailuo 2.3",
  credits: "70",
  iconUrl: "/model-logos/nano-banana.jpg",
};

const PLACEHOLDERS: Record<Mode, string[]> = {
  image: [
    "Type a prompt…",
    "A futuristic city at sunset, cyberpunk style…",
    "Portrait lit by golden hour…",
    "Anime girl in a magical forest…",
  ],
  video: [
    "Type a prompt…",
    "A cinematic drone shot over mountains…",
    "A cat playing piano in slow motion…",
    "Anime fight scene with epic effects…",
  ],
};

type Tool = { id: string; name: string; route: string; Icon: IconCmp };

const IMAGE_TOOLS_LIST: Tool[] = [
  { id: "inpaint", name: "Inpaint", route: "/images/tools/inpaint", Icon: ToolBrushIcon },
  { id: "clothes-changer", name: "Clothes", route: "/images/tools/clothes-changer", Icon: ToolShirtIcon },
  { id: "headshot", name: "Headshot", route: "/images/tools/headshot", Icon: ToolPersonIcon },
  { id: "face-swap", name: "Face Magic", route: "/images/tools/face-swap", Icon: ToolFacesIcon },
  { id: "bg-remover", name: "BG Remove", route: "/images/tools/bg-remover", Icon: ToolEraseIcon },
  { id: "cartoon", name: "Cartoon", route: "/images/tools/cartoon", Icon: ToolMaskIcon },
  { id: "colorizer", name: "Colorize", route: "/images/tools/colorizer", Icon: ToolPaletteIcon },
  { id: "retouching", name: "Retouch", route: "/images/tools/retouching", Icon: ToolSparklesIcon },
  { id: "remover", name: "Remove", route: "/images/tools/remover", Icon: ToolScissorsIcon },
  { id: "sketch-to-image", name: "Sketch", route: "/images/tools/sketch-to-image", Icon: ToolPencilIcon },
  { id: "relight", name: "Relight", route: "/images/tools/relight", Icon: ToolBulbIcon },
  { id: "character-swap", name: "Character", route: "/images/tools/character-swap", Icon: ToolAvatarIcon },
  { id: "storyboard", name: "Storyboard", route: "/images/tools/storyboard", Icon: ToolFilmIcon },
  { id: "hair-changer", name: "Hair", route: "/images/tools/hair-changer", Icon: ToolHairIcon },
  { id: "avatar-generator", name: "Avatar", route: "/images/tools/avatar-generator", Icon: ToolAvatarIcon },
  { id: "product-photo", name: "Product", route: "/images/tools/product-photo", Icon: ToolBoxIcon },
  { id: "logo-generator", name: "Logo", route: "/images/tools/logo-generator", Icon: ToolLogoIcon },
  { id: "perspective-correction", name: "Perspective", route: "/images/tools/perspective-correction", Icon: ToolPerspectiveIcon },
];

const VIDEO_TOOLS_LIST: Tool[] = [
  { id: "swap-characters", name: "Swap", route: "/videos/tools/swap-characters", Icon: ToolFacesIcon },
  { id: "talking-photo", name: "Talking", route: "/videos/tools/talking-photo", Icon: ToolAvatarIcon },
  { id: "upscale", name: "Upscale", route: "/videos/tools/upscale", Icon: ToolUpscaleIcon },
  { id: "auto-caption", name: "Caption", route: "/videos/tools/auto-caption", Icon: ToolCaptionIcon },
  { id: "lip-sync", name: "Lip Sync", route: "/videos/tools/lip-sync", Icon: ToolMicIcon },
  { id: "video-extender", name: "Extend", route: "/videos/tools/video-extender", Icon: ToolExtendIcon },
  { id: "green-screen", name: "Green", route: "/videos/tools/green-screen", Icon: ToolGreenScreenIcon },
  { id: "video-colorizer", name: "Colorize", route: "/videos/tools/video-colorizer", Icon: ToolPaletteIcon },
  { id: "video-watermark", name: "Watermark", route: "/videos/tools/video-watermark", Icon: ToolWatermarkIcon },
  { id: "video-bg-replacer", name: "BG Replace", route: "/videos/tools/video-bg-replacer", Icon: ToolEraseIcon },
  { id: "video-intro", name: "Intro", route: "/videos/tools/video-intro", Icon: ToolFilmIcon },
  { id: "video-denoise", name: "Denoise", route: "/videos/tools/video-denoise", Icon: ToolNoiseIcon },
  { id: "thumbnail-generator", name: "Thumbnail", route: "/videos/tools/thumbnail-generator", Icon: ToolThumbIcon },
];

const MOCK_FEATURED_IMAGES = DEMO_IMAGE_TEMPLATES.slice(0, 12);
const MOCK_FEATURED_VIDEOS = DEMO_VIDEO_TEMPLATES.slice(0, 12);
const MOCK_COMMUNITY_IMAGES = DEMO_IMAGE_TEMPLATES;
const MOCK_COMMUNITY_VIDEOS = DEMO_VIDEO_TEMPLATES;

const modeFromPath = (p: string): Mode => (p.startsWith("/videos") ? "video" : "image");

const MediaHubPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(modeFromPath(location.pathname));
  const TOOL_IMAGES: Record<string, string> = {
    "inpaint": new URL("@/assets/tool-landing/inpaint.jpg", import.meta.url).href,
    "clothes-changer": new URL("@/assets/tool-landing/clothes-changer.jpg", import.meta.url).href,
    "headshot": new URL("@/assets/tool-landing/headshot.jpg", import.meta.url).href,
    "face-swap": new URL("@/assets/tool-landing/face-swap.jpg", import.meta.url).href,
    "bg-remover": new URL("@/assets/tool-landing/bg-remover.jpg", import.meta.url).href,
    "cartoon": new URL("@/assets/tool-landing/cartoon.jpg", import.meta.url).href,
    "colorizer": new URL("@/assets/tool-landing/colorizer.jpg", import.meta.url).href,
    "retouching": new URL("@/assets/tool-landing/retouching.jpg", import.meta.url).href,
    "remover": new URL("@/assets/tool-landing/remover.jpg", import.meta.url).href,
    "sketch-to-image": new URL("@/assets/tool-landing/sketch-to-image.jpg", import.meta.url).href,
    "relight": new URL("@/assets/tool-landing/relight.jpg", import.meta.url).href,
    "character-swap": new URL("@/assets/tool-landing/character-swap.jpg", import.meta.url).href,
    "storyboard": new URL("@/assets/tool-landing/storyboard.jpg", import.meta.url).href,
    "hair-changer": new URL("@/assets/tool-landing/hair-changer.jpg", import.meta.url).href,
    "avatar-generator": new URL("@/assets/tool-landing/avatar-generator.jpg", import.meta.url).href,
    "product-photo": new URL("@/assets/tool-landing/product-photo.jpg", import.meta.url).href,
    "logo-generator": new URL("@/assets/tool-landing/logo-generator.jpg", import.meta.url).href,
    "perspective-correction": new URL("@/assets/tool-landing/perspective-correction.jpg", import.meta.url).href,
    "swap-characters": new URL("@/assets/tool-landing/video-swap-v9.jpg", import.meta.url).href,
    "talking-photo": new URL("@/assets/tool-landing/talking-photo-v9.jpg", import.meta.url).href,
    "upscale": new URL("@/assets/tool-landing/video-upscale-v9.jpg", import.meta.url).href,
    "auto-caption": new URL("@/assets/tool-landing/auto-caption-v9.jpg", import.meta.url).href,
    "lip-sync": new URL("@/assets/tool-landing/lip-sync-v9.jpg", import.meta.url).href,
    "video-extender": new URL("@/assets/tool-landing/video-extender-v9.jpg", import.meta.url).href,
    "green-screen": new URL("@/assets/tool-landing/green-screen-v9.jpg", import.meta.url).href,
    "video-colorizer": new URL("@/assets/tool-landing/video-colorizer-v9.jpg", import.meta.url).href,
    "video-watermark": new URL("@/assets/tool-landing/video-watermark-v9.jpg", import.meta.url).href,
    "video-bg-replacer": new URL("@/assets/tool-landing/video-bg-replacer-v9.jpg", import.meta.url).href,
    "video-intro": new URL("@/assets/tool-landing/video-intro-v9.jpg", import.meta.url).href,
    "video-denoise": new URL("@/assets/tool-landing/video-denoise-v9.jpg", import.meta.url).href,
    "thumbnail-generator": new URL("@/assets/tool-landing/thumbnail-generator-v9.jpg", import.meta.url).href,
  };
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [imageModel, setImageModel] = useState<ModelOption>(NANO_BANANA_DEFAULT);
  const [videoModel, setVideoModel] = useState<ModelOption>(HAILUO_DEFAULT);
  const [attached, setAttached] = useState<string | null>(null);
  const [phIdx, setPhIdx] = useState(0);
  const [imageShowcase, setImageShowcase] = useState<ShowcaseItem[]>([]);
  const [videoShowcase, setVideoShowcase] = useState<ShowcaseItem[]>([]);
  const [studioItems, setStudioItems] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<ShowcaseItem[]>([]);
  const [communityCategory, setCommunityCategory] = useState<string>("All");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSub, setSettingsSub] = useState<null | "model" | "aspect" | "style" | "duration" | "improve">(null);
  const [imgAspect, setImgAspect] = useState("1:1");
  const [imgStyle, setImgStyle] = useState("Dynamic");
  const [vidAspect, setVidAspect] = useState("16:9");
  const [vidDuration, setVidDuration] = useState("6s");
  const [improveText, setImproveText] = useState("");
  const [improving, setImproving] = useState(false);
  const { models: allDynamicModels } = useDynamicModels();
  const { credits } = useCredits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e: Event) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
        setSettingsSub(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    setMode(modeFromPath(location.pathname));
  }, [location.pathname]);

  // Receive reused prompt or tab from template preview page
  useEffect(() => {
    const state = location.state as { reusePrompt?: string; tab?: Tab } | null;
    const reuse = state?.reusePrompt;
    const tab = state?.tab;
    if (reuse) {
      setPrompt(reuse);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
    if (tab) setActiveTab(tab);
    if (reuse || tab) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    setPhIdx(0);
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS[mode].length), 3500);
    return () => clearInterval(id);
  }, [mode]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [prompt]);

  useEffect(() => {
    // Hydrate showcase from cache, then refresh
    try {
      const c = localStorage.getItem("megsy_cache_showcase_v1");
      if (c) {
        const items = JSON.parse(c) as ShowcaseItem[];
        const imgs = items.filter((i) => i.media_type !== "video").slice(0, 12);
        const vids = items.filter((i) => i.media_type === "video").slice(0, 12);
        if (imgs.length) setImageShowcase(imgs as any);
        if (vids.length) setVideoShowcase(vids as any);
      }
    } catch {}
    (async () => {
      const { data } = await supabase
        .from("showcase_items")
        .select("*")
        .order("display_order", { ascending: true })
        .limit(40);
      const items = (data as any as ShowcaseItem[]) || [];
      const imgs = items.filter((i) => i.media_type !== "video").slice(0, 12);
      const vids = items.filter((i) => i.media_type === "video").slice(0, 12);
      setImageShowcase(imgs.length ? imgs : (MOCK_FEATURED_IMAGES as any));
      setVideoShowcase(vids.length ? vids : (MOCK_FEATURED_VIDEOS as any));
      try { if (items.length) localStorage.setItem("megsy_cache_showcase_v1", JSON.stringify(items)); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (activeTab === "studio") {
      try {
        const c = localStorage.getItem("megsy_cache_studio_v1");
        if (c) setStudioItems(JSON.parse(c));
      } catch {}
      loadStudio();
    }
    if (activeTab === "community") {
      try {
        const c = localStorage.getItem("megsy_cache_community_v1");
        if (c) setCommunityItems(JSON.parse(c));
      } catch {}
      loadCommunity();
    }
  }, [activeTab]);

  const loadStudio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setStudioItems([]);
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .in("mode", ["images", "videos"]);
    if (!convs?.length) return setStudioItems([]);
    const ids = convs.map((c) => c.id);
    const { data } = await supabase
      .from("messages")
      .select("content, images, created_at")
      .eq("role", "assistant")
      .not("images", "is", null)
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!data) return;
    const items = data.flatMap((m: any) =>
      (m.images || []).map((url: string) => {
        const isVid = url.includes(".mp4") || url.includes("video");
        return {
          url,
          type: isVid ? "video" : "image",
          prompt: (m.content || "").slice(0, 200),
          created_at: m.created_at,
        };
      }),
    );
    setStudioItems(items);
    try { localStorage.setItem("megsy_cache_studio_v1", JSON.stringify(items)); } catch {}
  };

  const loadCommunity = async () => {
    const { data } = await supabase
      .from("showcase_items")
      .select("*")
      .in("media_type", ["image", "video"])
      .order("display_order", { ascending: true })
      .limit(120);
    const dbItems = ((data as any[]) || []).map((it) => ({ ...it, category: it.category || "All" }));
    const demo = [...(MOCK_COMMUNITY_IMAGES as any[]), ...(MOCK_COMMUNITY_VIDEOS as any[])];
    const merged = [...dbItems, ...demo];
    setCommunityItems(merged as any);
    try { localStorage.setItem("megsy_cache_community_v1", JSON.stringify(merged)); } catch {}
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setShowAllTools(false);
    const target = m === "image" ? "/images" : "/videos";
    if (location.pathname !== target) navigate(target, { replace: true });
  };

  const currentModel = mode === "image" ? imageModel : videoModel;
  const tools = mode === "image" ? IMAGE_TOOLS_LIST : VIDEO_TOOLS_LIST;
  const showcase = mode === "image" ? imageShowcase : videoShowcase;

  const handleGenerate = () => {
    const p = prompt.trim();
    if (!p && !attached) return;
    if (mode === "image") {
      navigate("/images/studio", { state: { prompt: p, attachedImage: attached, model: imageModel } });
    } else {
      navigate("/videos/studio", { state: { prompt: p, attachedImage: attached, model: videoModel } });
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setAttached(r.result as string);
    r.readAsDataURL(f);
    e.target.value = "";
  };

  const canGenerate = !!(prompt.trim() || attached);

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col ios26-bg relative overflow-hidden">
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={() => {}}
          currentMode={mode === "image" ? "images" : "videos"}
        />
        <ModelPickerSheet
          open={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          onSelect={(m) => {
            if (mode === "image") setImageModel(m);
            else setVideoModel(m);
            setModelPickerOpen(false);
          }}
          mode={mode === "image" ? "images" : "videos"}
          selectedModelId={currentModel.id}
        />


        {/* Ambient orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 w-[60vw] h-[60vw] rounded-full opacity-60 blur-3xl"
          animate={{
            background:
              mode === "image"
                ? "radial-gradient(closest-side, hsl(var(--primary) / 0.30), transparent 70%)"
                : "radial-gradient(closest-side, hsl(var(--primary) / 0.18), transparent 70%)",
          }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-20 -right-24 w-[55vw] h-[55vw] rounded-full opacity-50 blur-3xl"
          animate={{
            background:
              mode === "image"
                ? "radial-gradient(closest-side, hsl(280 80% 60% / 0.22), transparent 70%)"
                : "radial-gradient(closest-side, hsl(340 80% 60% / 0.28), transparent 70%)",
          }}
          transition={{ duration: 0.8 }}
        />

        {/* Floating menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="ios-fab fixed top-4 left-4 z-30 w-11 h-11 flex items-center justify-center rounded-full text-foreground"
          aria-label="Menu"
        >
          <MenuIcon className="w-[20px] h-[20px]" />
        </button>

        {/* Floating credits pill — matches sidebar glass */}
        <button
          onClick={() => navigate("/billing")}
          className="ios-fab fixed top-4 right-4 z-30 h-11 px-3.5 flex items-center gap-1.5 rounded-full text-[13px] font-semibold text-foreground"
          aria-label="Credits"
        >
          <span className="text-amber-500 text-[15px] leading-none">✦</span>
          <span className="tabular-nums">{credits ?? "—"}</span>
        </button>

        <div ref={scrollContainerRef} className="relative z-10 flex-1 overflow-y-auto pb-28">
          {activeTab === "home" && (
            <>
              {/* Hero */}
              <div className="px-5 pt-16 pb-5">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="font-display text-[11vw] sm:text-[8vw] uppercase leading-[1] tracking-tight text-foreground"
                >
                  YOURS TO{" "}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="text-primary inline-block"
                    >
                      {mode === "image" ? "IMAGINE." : "ANIMATE."}
                    </motion.span>
                  </AnimatePresence>
                </motion.h1>
              </div>

              <div className="px-3 relative z-40">
                <div className="rounded-[26px] p-[1.5px] bg-gradient-to-br from-primary/80 via-fuchsia-500/60 to-orange-400/70 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]">
                <div ref={settingsRef} className="bg-background rounded-[24px] p-3 relative z-40">
                  {attached && (
                    <div className="mb-2 inline-flex items-center gap-1.5 ios26-chip !pl-1 !py-1">
                      <img src={attached} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <button
                        onClick={() => setAttached(null)}
                        className="text-foreground/70 hover:text-foreground pr-1.5"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="relative flex items-start gap-2 px-1 pt-1 pb-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl ios26-glass text-foreground/85 hover:text-foreground transition-colors"
                      aria-label="Attach image"
                    >
                      <ImagePlusIcon className="w-[20px] h-[20px]" />
                    </button>
                    <div className="relative flex-1 min-w-0">
                      <AnimatePresence mode="wait">
                        {!prompt && (
                          <motion.span
                            key={phIdx}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.35 }}
                            className="pointer-events-none absolute left-2 top-2.5 text-sm text-muted-foreground"
                          >
                            {PLACEHOLDERS[mode][phIdx]}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={1}
                        className="block w-full max-w-full bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-transparent px-2 py-2 overflow-y-auto break-words"
                        style={{ wordBreak: "break-word", maxHeight: "140px" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom controls */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Mode pill — text only */}
                    <div className="relative ios26-glass rounded-full p-1 flex items-center">
                      {(["image", "video"] as Mode[]).map((m) => {
                        const active = mode === m;
                        return (
                          <button
                            key={m}
                            onClick={() => switchMode(m)}
                            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 ${
                              active ? "text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="hub-mode-bg"
                                transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
                                className="absolute inset-0 rounded-full overflow-hidden"
                                style={{
                                  background:
                                    "linear-gradient(180deg, color-mix(in oklab, hsl(var(--primary)) 92%, white 8%), hsl(var(--primary)))",
                                  boxShadow:
                                    "inset 0 1px 0 color-mix(in oklab, white 28%, transparent), 0 6px 18px -6px hsl(var(--primary) / 0.55)",
                                }}
                              >
                                <motion.span
                                  aria-hidden
                                  className="absolute inset-y-0 -left-1/2 w-1/2"
                                  initial={{ x: 0 }}
                                  animate={{ x: "300%" }}
                                  transition={{ duration: 1.1, ease: "easeOut" }}
                                  style={{
                                    background:
                                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                                    filter: "blur(6px)",
                                  }}
                                />
                              </motion.span>
                            )}
                            <span className="relative">{m === "image" ? "Image" : "Video"}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        ref={settingsBtnRef}
                        onClick={() => {
                          setSettingsOpen((v) => !v);
                          setSettingsSub(null);
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl ios26-glass text-foreground/80 hover:text-foreground transition-colors ${settingsOpen ? "ring-1 ring-primary/40" : ""}`}
                        aria-label="Settings"
                        title={currentModel.name}
                      >
                        <SettingsGearIcon className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="ios26-button h-9 px-4 rounded-full text-xs flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                        Generate
                      </button>
                    </div>
                  </div>

                  {/* Inline settings panel — opens inside the card */}
                  <AnimatePresence>
                    {settingsOpen && (
                      <motion.div
                        key="settings-pop"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 right-0 top-full mt-2 z-50"
                      >
                        <div className="bg-popover/85 backdrop-blur-3xl backdrop-saturate-200 border border-border rounded-3xl shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.08),0_20px_60px_-20px_hsl(var(--foreground)/0.35)] p-2 max-h-[65vh] overflow-y-auto">
                          <AnimatePresence mode="wait" initial={false}>
                          {(() => {
                            const rows = mode === "image"
                              ? [
                                  { key: "model" as const, label: "Model", value: currentModel.name },
                                  { key: "aspect" as const, label: "Aspect Ratio", value: imgAspect },
                                  { key: "style" as const, label: "Style", value: imgStyle },
                                  { key: "improve" as const, label: "Improve Your Prompt", value: "" },
                                ]
                              : [
                                  { key: "model" as const, label: "Model", value: currentModel.name },
                                  { key: "aspect" as const, label: "Aspect Ratio", value: vidAspect },
                                  { key: "duration" as const, label: "Duration", value: vidDuration },
                                  { key: "improve" as const, label: "Improve Your Prompt", value: "" },
                                ];
                            const subOptions: Record<string, string[]> = {
                              aspect: mode === "image"
                                ? ["1:1", "2:3", "3:2", "4:3", "4:5", "16:9", "9:16"]
                                : ["1:1", "16:9", "9:16"],
                              style: ["Cinematic", "Creative", "Dynamic", "Fashion", "Portrait", "Stock Photo", "Vibrant", "None"],
                              duration: ["6s", "10s"],
                            };

                            // Inline MODEL picker
                            if (settingsSub === "model") {
                              const filtered = allDynamicModels.filter((m) =>
                                mode === "image" ? m.type === "image" : (m.type === "video" || m.type === "video-i2v"),
                              ).slice(0, 16);
                              return (
                                <motion.div
                                  key="model"
                                  initial={{ opacity: 0, x: 12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 12 }}
                                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <button
                                    onClick={() => setSettingsSub(null)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 mb-2"
                                  >
                                    <ChevronRightIcon className="w-3.5 h-3.5 rotate-180" />
                                    Back
                                  </button>
                                  <div className="flex flex-col gap-1 px-1 pb-1 max-h-[320px] overflow-y-auto scrollbar-hide">
                                    {filtered.map((m) => {
                                      const active = m.id === currentModel.id;
                                      return (
                                        <button
                                          key={m.id}
                                          onClick={() => {
                                            const opt: ModelOption = {
                                              id: m.id,
                                              name: m.name,
                                              credits: m.credits.toString(),
                                              requiresImage: m.requiresImage,
                                              category: "model",
                                            };
                                            if (mode === "image") setImageModel(opt); else setVideoModel(opt);
                                            setSettingsSub(null);
                                          }}
                                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                            active ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-accent"
                                          }`}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[13px] font-semibold text-foreground truncate">{m.name}</span>
                                              {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug mt-0.5">
                                              {m.description}
                                            </p>
                                          </div>
                                          <span className="text-[10.5px] text-muted-foreground/80 font-medium shrink-0">
                                            {m.credits === 0 ? "Free" : `${m.credits} MC`}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              );
                            }

                            // Inline IMPROVE WITH AI
                            if (settingsSub === "improve") {
                              const runImprove = async () => {
                                const seed = (improveText.trim() || prompt.trim());
                                if (!seed) { toast.error("Type an idea or prompt first"); return; }
                                setImproving(true);
                                try {
                                  const { data, error } = await supabase.functions.invoke("enhance-prompt", {
                                    body: { prompt: seed, type: mode === "image" ? "image" : "video" },
                                  });
                                  if (error) throw error;
                                  const enhanced = (data as any)?.enhanced;
                                  if (!enhanced) throw new Error("No prompt returned");
                                  setPrompt(enhanced);
                                  setImproveText("");
                                  setSettingsSub(null);
                                  setSettingsOpen(false);
                                   toast.success("Prompt enhanced ✨");
                                 } catch (e: any) {
                                   toast.error(e?.message || "Failed to enhance prompt");
                                } finally {
                                  setImproving(false);
                                }
                              };
                              return (
                                <motion.div
                                  key="improve"
                                  initial={{ opacity: 0, x: 12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 12 }}
                                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <button
                                    onClick={() => setSettingsSub(null)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 mb-2"
                                  >
                                    <ChevronRightIcon className="w-3.5 h-3.5 rotate-180" />
                                    Back
                                  </button>
                                  <div className="px-1 pb-1">
                                    <textarea
                                      value={improveText}
                                      onChange={(e) => setImproveText(e.target.value)}
                                      rows={3}
                                      placeholder="Write your prompt or describe your idea — we'll enhance it with AI…"
                                      className="w-full resize-none rounded-xl ios26-glass px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-1 focus:ring-primary/40"
                                      style={{ maxHeight: 160 }}
                                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runImprove(); }}
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <span className="text-[10.5px] text-muted-foreground">The result will be inserted into the input automatically</span>
                                      <button
                                        onClick={runImprove}
                                        disabled={improving}
                                        className="ios26-button h-9 px-4 rounded-full text-xs flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        {improving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        {improving ? "Improving…" : "Improve"}
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            }

                            if (settingsSub) {
                              const opts = subOptions[settingsSub] || [];
                              const current =
                                settingsSub === "aspect" ? (mode === "image" ? imgAspect : vidAspect)
                                : settingsSub === "style" ? imgStyle
                                : settingsSub === "duration" ? vidDuration
                                : "";
                              return (
                                <motion.div
                                  key={`sub-${settingsSub}`}
                                  initial={{ opacity: 0, x: 12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 12 }}
                                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <button
                                    onClick={() => setSettingsSub(null)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 mb-1.5"
                                  >
                                    <ChevronRightIcon className="w-3.5 h-3.5 rotate-180" />
                                    Back
                                  </button>
                                  <div className="flex flex-col gap-1 px-1 pb-1">
                                    {opts.map((opt) => {
                                      const active = opt === current;
                                      return (
                                        <button
                                          key={opt}
                                          onClick={() => {
                                            if (settingsSub === "aspect") {
                                              if (mode === "image") setImgAspect(opt); else setVidAspect(opt);
                                            } else if (settingsSub === "style") setImgStyle(opt);
                                            else if (settingsSub === "duration") setVidDuration(opt);
                                            setSettingsSub(null);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                            active
                                              ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                                              : "text-foreground/85 hover:bg-accent"
                                          }`}
                                        >
                                          <span>{opt}</span>
                                          {active && <Check className="w-3.5 h-3.5 text-primary" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              );
                            }

                            return (
                              <motion.div
                                key="main"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                className="grid grid-cols-1 gap-0.5"
                              >
                                {rows.map((r) => (
                                  <button
                                    key={r.key}
                                    onClick={() => setSettingsSub(r.key)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-accent transition-colors"
                                  >
                                    <span className="font-medium">{r.label}</span>
                                    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                      {r.value && <span className="truncate max-w-[110px]">{r.value}</span>}
                                      <ChevronRightIcon className="w-3.5 h-3.5" />
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            );
                          })()}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </div>
              </div>

              {/* Circular tools row — horizontal scroll + View All */}
              <div className="mt-7 relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode + (showAllTools ? "-all" : "")}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {(() => {
                      const half = Math.ceil(tools.length / 2);
                      const rowA = tools.slice(0, half);
                      const rowB = tools.slice(half);
                      const renderRow = (items: typeof tools, keyPrefix: string) => (
                        <motion.div
                          key={keyPrefix}
                          className="flex gap-3 overflow-x-auto pl-4 pr-4 scroll-pl-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: {},
                            show: { transition: { staggerChildren: 0.025, delayChildren: 0.04 } },
                          }}
                        >
                          {items.map((t) => {
                            const img = TOOL_IMAGES[t.id];
                            return (
                              <motion.button
                                key={t.id}
                                onClick={() => navigate(t.route)}
                                className="relative shrink-0 aspect-square w-[190px] h-[190px] rounded-[32px] overflow-hidden snap-start group isolate"
                                variants={{
                                  hidden: { opacity: 0, y: 14, scale: 0.85, filter: "blur(8px)" },
                                  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 360, damping: 26, mass: 0.6 } },
                                }}
                                whileTap={{ scale: 0.94, transition: { type: "spring", stiffness: 500, damping: 22 } }}
                              >
                                {img && (
                                  <img
                                    src={img}
                                    alt={t.name}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/15" />
                                <div className="absolute inset-x-0 bottom-2 flex items-center justify-center pointer-events-none">
                                  <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.4),inset_0_-0.5px_0_0_rgba(255,255,255,0.08),0_2px_8px_-2px_rgba(0,0,0,0.45)]">
                                    <span className="block text-[13px] font-semibold text-white text-center leading-none tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">
                                      {t.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/20 group-hover:ring-white/40 transition" />
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      );
                      return (
                        <div className="flex flex-col gap-3">
                          {renderRow(rowA, "row-a")}
                          {renderRow(rowB, "row-b")}
                        </div>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Featured — Leonardo-style rectangular cards */}
              <div className="mt-8 px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground">
                    Featured {mode === "image" ? "Images" : "Videos"}
                  </h3>
                  <button
                    onClick={() => setActiveTab("community")}
                    className="flex items-center gap-1 text-sm font-medium text-foreground/90 hover:text-foreground"
                  >
                    View More <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                {showcase.length === 0 ? (
                  <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="ios26-glass shrink-0 w-44 aspect-[3/4] rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
                    {showcase.map((it) => (
                      <button
                        key={it.id}
                        onClick={() => navigate(`/template/${it.id}`, { state: { item: it } })}
                        className="relative shrink-0 w-44 aspect-[3/4] rounded-2xl overflow-hidden bg-muted"
                      >
                        {it.media_type === "video" ? (
                          <video
                            src={(it as any).media_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={(it as any).media_url}
                            alt={it.prompt || ""}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {/* Play indicator for videos */}
                        {it.media_type === "video" && (
                          <span className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                            ▶
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                          <p className="text-[13px] font-bold text-white line-clamp-2 text-left leading-tight">
                            {it.prompt?.slice(0, 60) || "Featured"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "studio" && (
            <div className="px-4 pt-6 pb-32">
              {studioItems.length === 0 ? (
                <div className="mx-auto max-w-md mt-10 px-6 py-10 rounded-3xl bg-white/[0.05] backdrop-blur-3xl backdrop-saturate-200 border border-white/10 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_20px_50px_-20px_rgba(0,0,0,0.5)]">
                  <p className="text-foreground/80 text-sm">
                    Nothing in your studio yet
                  </p>
                  <button
                    onClick={() =>
                      navigate(mode === "image" ? "/images/studio" : "/videos/studio")
                    }
                    className="mt-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-sm text-white font-medium"
                  >
                    Start creating
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/[0.04] backdrop-blur-3xl backdrop-saturate-200 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_20px_60px_-25px_rgba(0,0,0,0.55)] p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {studioItems.map((it: any, i) => {
                      const isVid = it.type === "video";
                      const previewItem = { url: it.url, type: isVid ? "video" : "image", prompt: it.prompt, created_at: it.created_at };
                      return (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate(`/preview/${isVid ? "video" : "image"}`, { state: { item: previewItem } })}
                          className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] block"
                        >
                          {isVid ? (
                            <>
                              <video src={it.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-2xl border border-white/30">
                                  <span className="text-white text-[11px] ml-0.5">▶</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={it.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "community" && (
            <div className="pb-6">
              {/* Minimal editorial header */}
              <div className="px-5 pt-8 pb-6">
                <h1 className="font-display uppercase text-[34px] sm:text-[44px] leading-[0.9] tracking-tight text-foreground break-words">
                  Discover{" "}
                  <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
                    Templates
                  </span>
                </h1>
              </div>

              {(() => {
                const filtered = communityItems;

                if (filtered.length === 0) {
                  return (
                    <p className="text-center py-20 text-muted-foreground text-sm">
                      Templates gallery coming soon
                    </p>
                  );
                }

                const chunk = (n: number, size = 8) => filtered.slice(n * size, n * size + size);
                const sections = [
                  { title: "Trending", items: filtered.slice(0, 6), big: true },
                  { title: "Create", items: chunk(1) },
                  { title: "Refine & Scale", items: chunk(2) },
                  { title: "Motion", items: chunk(3) },
                  { title: "Editorial", items: chunk(4) },
                  { title: "Experimental", items: chunk(5) },
                ].filter((s) => s.items.length > 0);

                const renderCard = (item: any, big: boolean) => {
                  const cardSize = big ? "w-[228px] aspect-[4/5]" : "w-40 aspect-[3/4]";
                  return (
                    <div
                      key={item.id}
                      className={`relative shrink-0 ${cardSize} rounded-2xl overflow-hidden bg-muted snap-start group`}
                    >
                      <button
                        onClick={() => navigate(`/template/${item.id}`, { state: { item } })}
                        className="absolute inset-0 w-full h-full"
                      >
                        {item.media_type === "video" ? (
                          <video
                            src={item.media_url}
                            poster={item.thumbnail_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.media_url}
                            alt={item.prompt || ""}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {item.media_type === "video" && (
                          <span className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                            ▶
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                          <p
                            className={`font-bold text-white line-clamp-2 text-left leading-tight ${
                              big ? "text-[15px]" : "text-[13px]"
                            }`}
                          >
                            {item.prompt?.slice(0, 60) || "Template"}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                };

                const renderGridCard = (item: any) => (
                  <div
                    key={item.id}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted"
                  >
                    <button
                      onClick={() => navigate(`/template/${item.id}`, { state: { item } })}
                      className="absolute inset-0 w-full h-full"
                    >
                      {item.media_type === "video" ? (
                        <video
                          src={item.media_url}
                          poster={item.thumbnail_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.prompt || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {item.media_type === "video" && (
                        <span className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                          ▶
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                        <p className="font-bold text-white line-clamp-2 text-left leading-tight text-[12px]">
                          {item.prompt?.slice(0, 60) || "Template"}
                        </p>
                      </div>
                    </button>
                  </div>
                );

                const iosEase = [0.32, 0.72, 0, 1] as const;

                return (
                  <AnimatePresence mode="wait" initial={false}>
                    {expandedSection ? (() => {
                      const section = sections.find((s) => s.title === expandedSection);
                      if (!section) return null;
                      return (
                        <motion.div
                          key={`expanded-${expandedSection}`}
                          initial={{ opacity: 0, y: 14, scale: 0.985 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.99 }}
                          transition={{ duration: 0.55, ease: iosEase }}
                        >
                          <div className="flex items-center gap-3 mb-5 px-4">
                            <button
                              onClick={() => setExpandedSection(null)}
                              aria-label="Back"
                              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-foreground/[0.06] border border-foreground/10 text-foreground hover:bg-foreground/[0.12] active:scale-95 transition"
                            >
                              <ChevronRightIcon className="w-5 h-5 rotate-180" />
                            </button>
                            <h3 className="font-display uppercase tracking-tight text-foreground text-[26px]">
                              {section.title}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 px-4">
                            {section.items.map((it, i) => (
                              <motion.div
                                key={it.id}
                                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.985 }}
                                transition={{
                                  duration: 0.5,
                                  ease: iosEase,
                                  delay: 0.08 + Math.min(i * 0.045, 0.45),
                                }}
                              >
                                {renderGridCard(it)}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })() : (
                      <motion.div
                        key="sections"
                        className="space-y-7"
                        initial={{ opacity: 0, y: 14, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.99 }}
                        transition={{ duration: 0.55, ease: iosEase }}
                      >
                        {sections.map((section, sIdx) => (
                          <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.5,
                              ease: iosEase,
                              delay: sIdx * 0.07,
                            }}
                          >
                            <div className="flex items-center justify-between mb-3 px-4">
                              <h3
                                className={`font-display uppercase tracking-tight text-foreground ${
                                  section.big ? "text-[28px]" : "text-[22px]"
                                }`}
                              >
                                {section.title}
                              </h3>
                              <button
                                onClick={() => setExpandedSection(section.title)}
                                className="flex items-center gap-1 text-sm font-medium text-foreground/85 hover:text-foreground"
                              >
                                View More <ChevronRightIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex gap-2.5 overflow-x-auto overflow-y-visible scrollbar-hide pb-2 snap-x scroll-px-4 [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))]">
                              {section.items.map((it, i) => (
                                <motion.div
                                  key={it.id}
                                  className="shrink-0"
                                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    ease: iosEase,
                                    delay: sIdx * 0.07 + i * 0.04,
                                  }}
                                >
                                  {renderCard(it, !!section.big)}
                                </motion.div>
                              ))}
                              <div className="shrink-0 w-1" aria-hidden="true" />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })()}
            </div>
          )}
        </div>

        {/* Bottom floating pill nav */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/70 backdrop-blur-3xl backdrop-saturate-200 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_-1px_0_0_rgba(255,255,255,0.05),0_20px_50px_-15px_rgba(0,0,0,0.6)]">
            {[
              { key: "home" as Tab, Icon: GridHomeIcon },
              { key: "studio" as Tab, Icon: WandStudioIcon },
              { key: "community" as Tab, Icon: CompassIcon },
            ].map(({ key, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center justify-center w-14 h-11 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-[0_4px_14px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className="w-[22px] h-[22px] transition-colors"
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={mode === "image" ? "image/*" : "image/*,video/*"}
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </AppLayout>
  );
};

export default MediaHubPage;
