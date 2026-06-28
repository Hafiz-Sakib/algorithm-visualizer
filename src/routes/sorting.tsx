import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Controls } from "../components/viz/Controls";
import { PythonCodePanel } from "../components/PythonCodePanel";
import { inferLines } from "../lib/algorithms/lineMaps";
import { SORTERS, type SortName } from "../lib/algorithms/sorting";
import { usePlayer } from "../lib/usePlayer";

export const Route = createFileRoute("/sorting")({
  head: () => ({
    meta: [
      { title: "Sorting — AlgoViz" },
      { name: "description", content: "Animated bubble, selection, insertion, merge, and quick sort." },
    ],
  }),
  component: SortingPage,
});

const randomArray = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);

const ALGO_COLOR: Record<SortName, string> = {
  Bubble: "oklch(0.72 0.19 255)",
  Selection: "oklch(0.75 0.18 162)",
  Insertion: "oklch(0.82 0.18 85)",
  Merge: "oklch(0.68 0.22 22)",
  Quick: "oklch(0.75 0.18 310)",
  Heap: "oklch(0.72 0.22 180)",
  Shell: "oklch(0.80 0.18 45)",
  Counting: "oklch(0.73 0.20 140)",
  Radix: "oklch(0.70 0.20 280)",
  Cocktail: "oklch(0.78 0.18 20)",
  Gnome: "oklch(0.75 0.18 200)",
  Comb: "oklch(0.77 0.19 320)",
  Cycle: "oklch(0.74 0.20 100)",
};

function SortingPage() {
  const [algo, setAlgo] = useState<SortName>("Bubble");
  const [size, setSize] = useState(30);
  const [speed, setSpeed] = useState(80);
  const [array, setArray] = useState<number[]>(() => randomArray(30));
  const [custom, setCustom] = useState("");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const initialItems = useMemo(
    () => array.map((v, i) => ({ id: i, value: v })),
    [array],
  );

  const gen = useCallback(() => SORTERS[algo](array), [algo, array]);
  const { current, index, total, play, pause, reset, stepFwd, stepBack, playing } =
    usePlayer(gen, speed);

  const display = useMemo(() => {
    const arr = current?.array ?? array;
    const ids = initialItems.map((x) => x.id);
    const used = new Array(initialItems.length).fill(false);
    return arr.map((v) => {
      const idx = initialItems.findIndex((x, i) => !used[i] && x.value === v);
      if (idx >= 0) { used[idx] = true; return { id: ids[idx], value: v }; }
      return { id: Math.random(), value: v };
    });
  }, [current, array, initialItems]);

  const max = Math.max(...array, 1);

  const shuffle = (n = size) => { setArray(randomArray(n)); };

  const applyCustom = () => {
    const parts = custom.split(/[,\s]+/).map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    if (parts.length >= 2) { setArray(parts.slice(0, 80)); setSize(parts.length); }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-4 min-w-0">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" style={{ color: ALGO_COLOR[algo] }}>⟨⟩</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Sorting</h1>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Compare-and-swap visualizations with animated reordering.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SORTERS) as SortName[]).map((name) => (
            <button
              key={name}
              onClick={() => setAlgo(name)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105"
              style={{
                background: algo === name ? ALGO_COLOR[name] : "oklch(1 0 0 / 6%)",
                color: algo === name ? "oklch(0.08 0.02 265)" : "oklch(0.65 0.04 255)",
                border: `1px solid ${algo === name ? ALGO_COLOR[name] : "oklch(1 0 0 / 10%)"}`,
                boxShadow: algo === name ? `0 0 12px ${ALGO_COLOR[name]}40` : "none",
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </header>

      {/* Viz */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.40 0.04 255)" }}>visualization</span>
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.40 0.04 255)" }}>{array.length} elements</span>
        </div>
        <div className="flex h-[240px] sm:h-[320px] md:h-[380px] items-end gap-[2px] px-3 pb-3">
          {display.map((item, i) => {
            const isCompare = current?.compare?.includes(i);
            const isSwap = current?.swap?.includes(i);
            const isSorted = current?.sorted?.includes(i);
            const isPivot = current?.pivot === i;
            const isHovered = hoverIdx === i;
            const color = isSwap
              ? "var(--danger)"
              : isPivot
              ? "var(--warn)"
              : isCompare
              ? ALGO_COLOR[algo]
              : isSorted
              ? "var(--accent)"
              : isHovered
              ? "oklch(1 0 0 / 30%)"
              : "oklch(1 0 0 / 12%)";
            const active = isCompare || isSwap || isPivot;
            return (
              <motion.div
                key={item.id}
                layout
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className={`relative flex-1 rounded-t ${isSwap ? "viz-breathe" : ""} ${isSorted ? "viz-sparkle" : ""}`}
                style={{
                  height: `${(item.value / max) * 100}%`,
                  background: color,
                  minWidth: "1px",
                  boxShadow: active
                    ? `0 0 10px ${color}90, 0 0 2px ${color}`
                    : isSorted
                    ? `0 0 4px ${color}40`
                    : "none",
                  scale: isHovered ? 1.08 : 1,
                  transformOrigin: "bottom",
                  color: "transparent",
                }}
                title={String(item.value)}
              >
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none"
                    style={{ background: "oklch(0.10 0.02 265 / 95%)", color: "oklch(0.92 0.01 255)", border: "1px solid oklch(1 0 0 / 14%)" }}
                  >
                    {item.value}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Live status strip */}
      <AnimatePresence mode="wait">
        {(current?.compare || current?.swap || current?.pivot !== undefined) && (
          <motion.div
            key={`${index}-${current?.compare?.join(",")}-${current?.swap?.join(",")}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] font-mono px-3 py-1.5 rounded-lg inline-flex items-center gap-2"
            style={{ background: `${ALGO_COLOR[algo]}10`, border: `1px solid ${ALGO_COLOR[algo]}25`, color: ALGO_COLOR[algo] }}
          >
            <span className="viz-rail-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: ALGO_COLOR[algo] }} />
            {current?.swap ? `Swapping indices ${current.swap.join(" ↔ ")}` : current?.pivot !== undefined ? `Pivot at index ${current.pivot}` : `Comparing indices ${current?.compare?.join(" vs ")}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "oklch(0.50 0.04 255)" }}>
        {[
          { color: ALGO_COLOR[algo], label: "Comparing" },
          { color: "var(--danger)", label: "Swapping" },
          { color: "var(--warn)", label: "Pivot" },
          { color: "var(--accent)", label: "Sorted" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <Controls
        playing={playing}
        onPlay={play}
        onPause={pause}
        onReset={reset}
        onStepBack={stepBack}
        onStepFwd={stepFwd}
        speed={speed}
        setSpeed={setSpeed}
        index={index}
        total={total}
      />

      {/* Controls panel */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "oklch(0.12 0.025 265)", border: "1px solid oklch(1 0 0 / 8%)" }}>
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "oklch(0.50 0.04 255)" }}>Array Size — {size}</label>
          <input type="range" min={5} max={80} value={size} onChange={(e) => { const n = Number(e.target.value); setSize(n); shuffle(n); }} className="w-full" />
          <button
            onClick={() => shuffle()}
            className="h-8 px-4 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: ALGO_COLOR[algo], color: "oklch(0.08 0.02 265)", boxShadow: `0 0 12px ${ALGO_COLOR[algo]}30` }}
          >
            ↻ Shuffle
          </button>
        </div>
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "oklch(0.12 0.025 265)", border: "1px solid oklch(1 0 0 / 8%)" }}>
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "oklch(0.50 0.04 255)" }}>Custom Data</label>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 12, 5, 33, 8, 21"
              className="flex-1 h-8 px-3 rounded-lg text-xs font-mono"
              style={{ background: "oklch(1 0 0 / 5%)", border: "1px solid oklch(1 0 0 / 10%)", color: "oklch(0.85 0.01 255)" }}
            />
            <button
              onClick={applyCustom}
              className="h-8 px-3 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: "oklch(1 0 0 / 8%)", color: "oklch(0.75 0.04 255)", border: "1px solid oklch(1 0 0 / 12%)" }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      </div>
      <aside className="min-w-0">
        <PythonCodePanel section="sorting" algo={algo} accentColor={ALGO_COLOR[algo]} activeLines={inferLines("sorting", algo, current)} />
      </aside>
    </div>
  );
}
