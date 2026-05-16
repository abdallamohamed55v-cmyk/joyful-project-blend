import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";

// Below-the-fold — lazy load to keep landing FCP fast on weak devices
const StatsMarquee = lazy(() => import("@/components/landing/StatsMarquee"));
const ReferralBanner = lazy(() => import("@/components/landing/ReferralBanner"));
const HorizontalGallery = lazy(() => import("@/components/landing/HorizontalGallery"));
const StickyFeatureTabs = lazy(() => import("@/components/landing/StickyFeatureTabs"));
const ParallaxShowcase = lazy(() => import("@/components/landing/ParallaxShowcase"));
const ShowcaseGallery = lazy(() => import("@/components/landing/ShowcaseGallery"));
const ModelsMarquee = lazy(() => import("@/components/landing/ModelsMarquee"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const PricingPreview = lazy(() => import("@/components/landing/PricingPreview"));
const ReferralSection = lazy(() => import("@/components/landing/ReferralSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const LandingFooter = lazy(() => import("@/components/landing/LandingFooter"));

const SectionFallback = () => <div className="min-h-[200px]" />;

const LandingPage = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/chat", { replace: true });
      } else {
        setReady(true);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    // Lazy-load Lenis after first paint — not needed for initial render.
    // Skip on devices that prefer reduced motion or have very low memory.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 2;
    if (prefersReducedMotion || lowMemory) return;

    let destroy: (() => void) | undefined;
    const start = async () => {
      const { default: Lenis } = await import("lenis");
      const lenis = new Lenis({
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      let rafId = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      destroy = () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    };
    const idle = (window as any).requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 1500 }) : setTimeout(start, 600);
    return () => {
      if (idle && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      else clearTimeout(handle as any);
      destroy?.();
    };
  }, [ready]);

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNavbar />
      <HeroSection />
      <Suspense fallback={<SectionFallback />}>
        <StatsMarquee />
        <ReferralBanner />
        <HorizontalGallery />
        <StickyFeatureTabs />
        <ParallaxShowcase />
        <ShowcaseGallery />
        <ModelsMarquee />
        <HowItWorks />
        <PricingPreview />
        <ReferralSection />
        <FAQSection />
        <CTASection />
        <LandingFooter />
      </Suspense>
    </div>
  );
};

export default LandingPage;
