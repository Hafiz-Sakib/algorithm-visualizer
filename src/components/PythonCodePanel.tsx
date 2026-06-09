import { useMemo, useState } from "react";
import { PYTHON_CODES, type PySection } from "../lib/algorithms/python";

interface PythonCodePanelProps {
  section: PySection;
  algo: string;
  accentColor: string;
  /** Visual mode. "tabs" = stacked toggle view (mobile/small screens). "panel" = always-visible code panel (side-by-side on md+). */
  variant?: "tabs" | "panel";
}

// Tiny Python-only syntax highlighter (regex-based; safe for short snippets).
const PY_KEYWORDS = [
  "def","return","if","else","elif","for","while","in","not","and","or",
  "import","from","as","True","False","None","class","lambda","pass",
  "break","continue","try","except","finally","raise","with","yield","global","nonlocal",
];
const PY_BUILTINS = [
  "range","len","min","max","int","str","print","set","list","dict","tuple",
  "sum","abs","map","filter","enumerate","reversed","sorted","zip","any","all",
  "ord","chr","pow","float","bool",
];

function highlightPython(code: string): string {
  let out = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Strings (triple + single/double). Triple-quoted first.
  out = out.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="tok-str">$1</span>');
  out = out.replace(/(?<!class=")(["'])(?:(?!\1)[^\\\n]|\\.)*?\1/g, '<span class="tok-str">$&</span>');

  // Comments
  out = out.replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>');

  // Numbers
  out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');

  // Keywords
  out = out.replace(
    new RegExp(`\\b(${PY_KEYWORDS.join("|")})\\b`, "g"),
    '<span class="tok-kw">$1</span>',
  );

  // Builtins
  out = out.replace(
    new RegExp(`\\b(${PY_BUILTINS.join("|")})\\b(?=\\s*\\()`, "g"),
    '<span class="tok-builtin">$1</span>',
  );

  // def NAME -> highlight function name
  out = out.replace(/\b(def)\s+([A-Za-z_]\w*)/g, '<span class="tok-kw">def</span> <span class="tok-fn">$2</span>');

  return out;
}

export function PythonCodePanel({
  section,
  algo,
  accentColor,
  variant = "panel",
}: PythonCodePanelProps) {
  const snippet = PYTHON_CODES[section]?.[algo];
  const [copied, setCopied] = useState(false);
  const html = useMemo(
    () => (snippet ? highlightPython(snippet.code) : ""),
    [snippet],
  );

  if (!snippet) {
    return (
      <div
        className="rounded-2xl p-4 text-xs"
        style={{
          background: "oklch(0.10 0.02 265)",
          border: "1px solid oklch(1 0 0 / 8%)",
          color: "oklch(0.55 0.04 255)",
        }}
      >
        Python implementation coming soon for <strong>{algo}</strong>.
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const download = () => {
    const blob = new Blob([snippet.code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeAlgo = algo.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.href = url;
    a.download = `${section}_${safeAlgo}.py`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "oklch(0.10 0.02 265)",
        border: "1px solid oklch(1 0 0 / 8%)",
        minHeight: variant === "panel" ? "240px" : undefined,
      }}
    >
      <style>{`
        .py-code .tok-kw      { color: oklch(0.72 0.19 255); font-weight: 600; }
        .py-code .tok-fn      { color: oklch(0.82 0.18 85); }
        .py-code .tok-builtin { color: oklch(0.78 0.16 200); }
        .py-code .tok-str     { color: oklch(0.75 0.18 162); }
        .py-code .tok-num     { color: oklch(0.75 0.18 310); }
        .py-code .tok-comment { color: oklch(0.45 0.04 255); font-style: italic; }
      `}</style>

      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 6%)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: "oklch(0.40 0.04 255)" }}
          >
            python · {algo}
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            Time {snippet.time}
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.55 0.04 255)" }}
          >
            Space {snippet.space}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={download}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-105"
            style={{
              background: "oklch(1 0 0 / 6%)",
              color: "oklch(0.55 0.04 255)",
              border: "1px solid oklch(1 0 0 / 10%)",
            }}
            title="Download .py file"
          >
            ⬇ Download
          </button>
          <button
            onClick={copy}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all hover:scale-105"
            style={{
              background: "oklch(1 0 0 / 6%)",
              color: copied ? "oklch(0.75 0.18 162)" : "oklch(0.55 0.04 255)",
              border: "1px solid oklch(1 0 0 / 10%)",
            }}
          >
            {copied ? "✓ Copied" : "⎘ Copy"}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div
        className="overflow-auto flex-1"
        style={{
          maxHeight: variant === "panel" ? "560px" : "420px",
        }}
      >
        <pre
          className="py-code text-[12px] font-mono leading-relaxed px-4 py-3"
          style={{
            color: "oklch(0.82 0.02 255)",
            whiteSpace: "pre",
            minWidth: "max-content",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
