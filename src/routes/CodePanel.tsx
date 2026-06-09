import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALGORITHM_CODES, type LangKey } from "../../lib/algorithmCodes";

interface CodePanelProps {
  algo: string;
  accentColor: string;
}

const LANGS: { key: LangKey; label: string }[] = [
  { key: "python", label: "Python" },
  { key: "javascript", label: "JavaScript" },
  { key: "cpp", label: "C++" },
  { key: "java", label: "Java" },
];

// Simple token-based syntax highlighter
function highlight(code: string, lang: LangKey): string {
  const keywords: Record<LangKey, string[]> = {
    python: ["def","return","if","else","elif","for","while","in","not","and","or","import","from","True","False","None","class","lambda","range","len","min","max","int","print","set","list"],
    javascript: ["function","return","if","else","for","while","let","const","var","new","of","in","true","false","null","undefined","class","=>","Math","Array","typeof","instanceof"],
    cpp: ["void","int","bool","vector","string","auto","if","else","for","while","return","true","false","include","using","namespace","std","swap","pair","queue","stack","map","set","priority_queue","size_t","long","short","unsigned"],
    java: ["void","int","boolean","String","List","Map","Set","Queue","if","else","for","while","return","true","false","null","new","class","public","private","static","final","Arrays","ArrayList","LinkedList","HashMap","PriorityQueue","Collections","Math","Integer"],
  };

  // Escape HTML
  let result = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Strings
  result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="tok-str">$&</span>');
  // Comments
  result = result.replace(/(\/\/[^\n]*)|(#[^\n]*)/g, '<span class="tok-comment">$&</span>');
  // Numbers
  result = result.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
  // Keywords
  const kws = keywords[lang] ?? [];
  kws.forEach(kw => {
    result = result.replace(new RegExp(`\\b(${kw})\\b`, "g"), '<span class="tok-kw">$1</span>');
  });
  // Function calls
  result = result.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="tok-fn">$1</span>');

  return result;
}

export function CodePanel({ algo, accentColor }: CodePanelProps) {
  const [lang, setLang] = useState<LangKey>("python");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const snippet = ALGORITHM_CODES[algo];
  if (!snippet) return null;

  const code = snippet.codes[lang];

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
    >
      {/* Header bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-white/5"
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.40 0.04 255)" }}>
            code
          </span>
          {/* Complexity badges */}
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            Time: {snippet.complexity.time}
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.55 0.04 255)" }}
          >
            Space: {snippet.complexity.space}
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs"
          style={{ color: "oklch(0.50 0.04 255)" }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Description */}
            <div className="px-4 pb-2">
              <p className="text-xs" style={{ color: "oklch(0.60 0.04 255)" }}>
                {snippet.description}
              </p>
            </div>

            {/* Lang tabs + copy */}
            <div
              className="flex items-center justify-between px-4 py-2 gap-2"
              style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <div className="flex gap-1">
                {LANGS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setLang(key)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150"
                    style={{
                      background: lang === key ? `${accentColor}22` : "transparent",
                      color: lang === key ? accentColor : "oklch(0.50 0.04 255)",
                      border: `1px solid ${lang === key ? `${accentColor}40` : "transparent"}`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-105"
                style={{
                  background: "oklch(1 0 0 / 6%)",
                  color: copied ? "oklch(0.75 0.18 162)" : "oklch(0.55 0.04 255)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                }}
              >
                {copied ? "✓ Copied" : "⎘ Copy"}
              </button>
            </div>

            {/* Code block */}
            <div
              className="overflow-x-auto px-4 pb-4"
              style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <style>{`
                .code-block .tok-kw  { color: oklch(0.72 0.19 255); font-weight: 600; }
                .code-block .tok-fn  { color: oklch(0.82 0.18 85); }
                .code-block .tok-str { color: oklch(0.75 0.18 162); }
                .code-block .tok-num { color: oklch(0.75 0.18 310); }
                .code-block .tok-comment { color: oklch(0.45 0.04 255); font-style: italic; }
              `}</style>
              <pre
                className="code-block text-[12px] font-mono leading-relaxed pt-3"
                style={{ color: "oklch(0.78 0.02 255)", whiteSpace: "pre", minWidth: "max-content" }}
                dangerouslySetInnerHTML={{ __html: highlight(code, lang) }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
