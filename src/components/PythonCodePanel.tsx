import { useMemo, useState } from "react";
import { PYTHON_CODES, type PySection } from "../lib/algorithms/python";

interface PythonCodePanelProps {
  section: PySection;
  algo: string;
  accentColor: string;
  /** Lines (1-indexed) to highlight as currently-executing. */
  activeLines?: number[];
}

export function PythonCodePanel({
  section,
  algo,
  accentColor,
  activeLines = [],
}: PythonCodePanelProps) {
  const snippet = PYTHON_CODES[section]?.[algo];
  const [copied, setCopied] = useState(false);

  // Plain C++ source — no syntax highlighting markup, just the raw code lines.
  const lines = useMemo(() => {
    if (!snippet) return [] as string[];
    return snippet.code.split("\n");
  }, [snippet]);

  const activeSet = useMemo(() => new Set(activeLines), [activeLines]);

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
        C++ implementation coming soon for <strong>{algo}</strong>.
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  const download = () => {
    const blob = new Blob([snippet.code], { type: "text/x-c++src" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeAlgo = algo.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.href = url;
    a.download = `${section}_${safeAlgo}.cpp`;
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
      }}
    >
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
            c++ · {algo}
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
          {activeLines.length > 0 && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
              title="Currently executing lines"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              line {activeLines.join(", ")}
            </span>
          )}
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
            title="Download .cpp file"
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
      <div className="overflow-x-auto">
        <pre
          className="text-[12px] font-mono leading-relaxed py-3"
          style={{
            color: "oklch(0.82 0.02 255)",
            whiteSpace: "pre",
            minWidth: "max-content",
            margin: 0,
          }}
        >
          {lines.map((text, i) => {
            const lineNo = i + 1;
            const isActive = activeSet.has(lineNo);
            return (
              <div
                key={i}
                className="flex"
                style={{
                  background: isActive ? `${accentColor}22` : "transparent",
                  borderLeft: `3px solid ${isActive ? accentColor : "transparent"}`,
                  transition: "background-color 120ms ease",
                }}
              >
                <span
                  className="select-none text-right pr-3 pl-2"
                  style={{
                    color: isActive ? accentColor : "oklch(0.35 0.03 255)",
                    minWidth: "2.5rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {lineNo}
                </span>
                <span className="flex-1 pr-4">{text.length ? text : "\u00a0"}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
