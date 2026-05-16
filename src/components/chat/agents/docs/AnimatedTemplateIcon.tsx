import { motion } from "framer-motion";
import { memo } from "react";

/**
 * Unique animated SVG glyph per @docs template id.
 * Each glyph has a subtle continuous loop (rotate / pulse / draw / shift)
 * so the template grid feels alive without being distracting.
 */

type Props = {
  id: string;
  size?: number;
  /** Tailwind text color class for the stroke / accent color. */
  className?: string;
};

const stroke = "currentColor";

function ReviewExpert({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <motion.rect
        x="10" y="6" width="24" height="32" rx="3"
        stroke={stroke} strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <motion.path d="M15 16h12M15 22h12M15 28h8" stroke={stroke} strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 1 }} />
      <motion.circle cx="33" cy="33" r="6.5" stroke={stroke} strokeWidth="2.2"
        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: "33px 33px" }} />
      <motion.path d="M38 38l4.5 4.5" stroke={stroke} strokeWidth="2.4" strokeLinecap="round"
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  );
}

function Translation({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <motion.text x="10" y="22" fontFamily="serif" fontSize="16" fontWeight="700" fill={stroke}
        animate={{ y: [22, 20, 22] }} transition={{ duration: 2.4, repeat: Infinity }}>A</motion.text>
      <motion.path d="M20 26 L26 26" stroke={stroke} strokeWidth="2" strokeLinecap="round"
        animate={{ x: [-2, 2, -2] }} transition={{ duration: 1.6, repeat: Infinity }} />
      <motion.path d="M22 23 L26 26 L22 29" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        animate={{ x: [-2, 2, -2] }} transition={{ duration: 1.6, repeat: Infinity }} />
      <motion.text x="30" y="34" fontFamily="serif" fontSize="16" fontWeight="700" fill={stroke}
        animate={{ y: [34, 32, 34] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}>文</motion.text>
    </svg>
  );
}

function PdfDesign({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <motion.rect x="8" y="8" width="20" height="28" rx="2.5" stroke={stroke} strokeWidth="2"
        animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity }}
        style={{ transformOrigin: "18px 22px" }} />
      <motion.rect x="20" y="12" width="20" height="28" rx="2.5" stroke={stroke} strokeWidth="2" fill="currentColor" fillOpacity="0.08"
        animate={{ rotate: [3, -3, 3] }} transition={{ duration: 3, repeat: Infinity }}
        style={{ transformOrigin: "30px 26px" }} />
      <motion.path d="M25 22h10M25 27h10M25 32h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  );
}

function Report({ size = 28 }: { size?: number }) {
  const bars = [10, 18, 14, 22];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="6" width="36" height="36" rx="3" stroke={stroke} strokeWidth="2" />
      {bars.map((h, i) => (
        <motion.rect key={i} x={11 + i * 7} y={36 - h} width="4.5" height={h} rx="1" fill={stroke}
          initial={{ scaleY: 0 }} animate={{ scaleY: [0.4, 1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          style={{ transformOrigin: `${13 + i * 7}px 36px` }} />
      ))}
    </svg>
  );
}

function Contract({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <motion.path d="M24 6 L24 14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <motion.path d="M14 14 L34 14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <motion.g animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "24px 14px" }}>
        <path d="M10 14 L14 26 L6 26 Z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <path d="M38 14 L42 26 L34 26 Z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </motion.g>
      <path d="M20 40 L28 40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 14 L24 40" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}

function Financial({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="28" rx="3" stroke={stroke} strokeWidth="2" />
      <motion.path d="M10 32 L18 24 L24 28 L34 16" stroke={stroke} strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, times: [0, 0.5, 0.85, 1] }} />
      <motion.path d="M30 16 L34 16 L34 20" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.4, 0.85, 1] }} />
    </svg>
  );
}

function Academic({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <motion.path d="M6 18 L24 10 L42 18 L24 26 Z" stroke={stroke} strokeWidth="2" strokeLinejoin="round"
        animate={{ y: [0, -1.5, 0] }} transition={{ duration: 2.4, repeat: Infinity }} />
      <path d="M14 22 L14 32 C14 35 19 37 24 37 C29 37 34 35 34 32 L34 22" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <motion.path d="M40 19 L40 28" stroke={stroke} strokeWidth="2" strokeLinecap="round"
        animate={{ rotate: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
        style={{ transformOrigin: "40px 19px" }} />
      <motion.circle cx="40" cy="30" r="1.6" fill={stroke}
        animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
        style={{ transformOrigin: "40px 30px" }} />
    </svg>
  );
}

function Legal({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M10 40 L38 40" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 40 L20 18 L28 18 L28 40" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <motion.g animate={{ rotate: [-22, 18, -22] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "24px 14px" }}>
        <rect x="14" y="6" width="20" height="6" rx="1.5" stroke={stroke} strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
        <path d="M24 12 L24 18" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

const REGISTRY: Record<string, (p: { size?: number }) => JSX.Element> = {
  "review-expert": ReviewExpert,
  "translation": Translation,
  "pdf-design": PdfDesign,
  "professional-report": Report,
  "contract-review": Contract,
  "financial-modeling": Financial,
  "academic-paper": Academic,
  "legal-doc": Legal,
};

function AnimatedTemplateIcon({ id, size = 28, className = "" }: Props) {
  const Glyph = REGISTRY[id] ?? Report;
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <Glyph size={size} />
    </span>
  );
}

export default memo(AnimatedTemplateIcon);
