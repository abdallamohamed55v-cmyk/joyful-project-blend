// Help center — guides for every page/section in the app.
import { useNavigate } from "react-router-dom";
import { goBackOr } from "@/lib/navigation";
import { BackIcon } from "@/components/settings/SettingsIcons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    title: "Getting started",
    items: [
      { q: "What is Megsy?", a: "Megsy is an all-in-one AI creative platform — chat, images, videos, code and file analysis, all running on Megsy Credits (MC)." },
      { q: "How do credits (MC) work?", a: "Every action consumes MC. Chat costs 1 MC, images start at 2 MC, videos at 8 MC. Your balance is shown in Settings → Billing." },
      { q: "How do I sign in?", a: "Go to /auth and sign in with email or Google. Forgot your password? Use the recovery link on the login screen." },
    ],
  },
  {
    title: "Chat",
    items: [
      { q: "How do I start a chat?", a: "Open the home page and type your prompt. You can attach files, enable web search, and switch models from the input bar." },
      { q: "Can Megsy remember things about me?", a: "Yes — important details are saved in Memory. Manage them from Settings → Memory." },
    ],
  },
  {
    title: "Images & Video",
    items: [
      { q: "How do I generate an image?", a: "Open Image Studio, pick a model, write your prompt, choose ratio and quality, then generate." },
      { q: "How do I generate a video?", a: "Open Video Studio, pick a model, optionally upload a starting image, and write your prompt." },
    ],
  },
  {
    title: "Workspaces",
    items: [
      { q: "What is a workspace?", a: "A shared space for teams. Members share credits and content. Switch from the account switcher in Settings." },
      { q: "How do I invite a member?", a: "Open Settings → Workspaces → pick a workspace → Members → Invite." },
    ],
  },
  {
    title: "Billing & Plans",
    items: [
      { q: "How do I buy credits?", a: "Settings → Billing → Buy credits. You can pay with card or supported local methods." },
      { q: "How do I upgrade my plan?", a: "Visit /pricing and choose a plan. Upgrades take effect immediately." },
      { q: "Refunds?", a: "Contact our team from Settings → Help & Support → Contact our team." },
    ],
  },
  {
    title: "Settings & Privacy",
    items: [
      { q: "Where do I change my email or password?", a: "Settings → Account → Change email / Change password." },
      { q: "How do I delete my account?", a: "Settings → Account → Delete account. This is irreversible." },
      { q: "How do I export my data?", a: "Settings → Privacy & Data → Export." },
    ],
  },
];

export default function SettingsHelpPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-2xl mx-auto px-5 pb-16">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => goBackOr(navigate, "/settings/support")} className="w-9 h-9 grid place-items-center rounded-xl text-foreground/70 hover:bg-muted/50 transition-colors">
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Help Center</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Guides and answers for every page and section in Megsy.
        </p>

        <div className="space-y-8">
          {sections.map((sec) => (
            <section key={sec.title}>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70 mb-2">
                {sec.title}
              </p>
              <Accordion type="single" collapsible className="border border-border rounded-2xl bg-card divide-y divide-border">
                {sec.items.map((it, i) => (
                  <AccordionItem key={i} value={`${sec.title}-${i}`} className="border-0 px-4">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                      {it.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
