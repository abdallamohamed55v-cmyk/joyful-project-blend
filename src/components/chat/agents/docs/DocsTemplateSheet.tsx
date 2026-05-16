import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { DOCS_TEMPLATES, type DocsTemplate } from "@/lib/agent/docs/templates";
import AnimatedTemplateIcon from "./AnimatedTemplateIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedId?: string | null;
  onSelect: (t: DocsTemplate) => void;
}

export default function DocsTemplateSheet({ open, onClose, selectedId, onSelect }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-[81] max-h-[85dvh] rounded-t-3xl bg-background border-t border-border/40 shadow-[0_-12px_40px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/30">
              <div>
                <h3 className="text-base font-semibold">قوالب المستندات</h3>
                <p className="text-[12px] text-muted-foreground">اختر قالبًا للبدء</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full grid place-items-center hover:bg-foreground/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 grid grid-cols-2 gap-3">
              {DOCS_TEMPLATES.map((t) => {
                const active = selectedId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { onSelect(t); onClose(); }}
                    className={`group flex flex-col items-start gap-2 p-4 rounded-2xl border text-start transition ${
                      active
                        ? "border-primary/60 bg-primary/[0.06]"
                        : "border-border/40 bg-background hover:border-foreground/20 hover:bg-foreground/[0.03]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl grid place-items-center ${t.bg} ${t.color}`}>
                      <AnimatedTemplateIcon id={t.id} size={30} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</div>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground/80 uppercase tracking-wider">
                      {t.formats.join(" · ")}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
