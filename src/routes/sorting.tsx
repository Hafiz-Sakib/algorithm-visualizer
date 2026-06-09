import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Controls } from "../components/viz/Controls";
import { SORTERS, type SortName } from "../lib/algorithms/sorting";
import { usePlayer } from "../lib/usePlayer";

export const Route = createFileRoute("/sorting")({
  head: () => ({
    meta: [
      { title: "Sorting Visualizer — AlgoViz" },
      { name: "description", content: "Animated bubble, selection, insertion, merge, and quick sort." },
    ],
  }),
  component: SortingPage,
});

const randomArray = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);

function SortingPage() {
  const [algo, setAlgo] = useState<SortName>("Bubble");
  const [size, setSize] = useState(30);
  const [speed, setSpeed] = useState(80);
  const [array, setArray] = useState<number[]>(() => randomArray(30));
  const [custom, setCustom] = useState("");

  // Tag each value with a stable id so Framer Motion `layout` can animate swaps.
  const initialItems = useMemo(
    () => array.map((v, i) => ({ id: i, value: v })),
    [array],
  );

  const gen = useCallback(() => SORTERS[algo](array), [algo, array]);
  const { current, index, total, play, pause, reset, stepFwd, stepBack, playing } =
    usePlayer(gen, speed);

  // Map current step's array back onto the original id-tagged items so layout animation works.
  const display = useMemo(() => {
    const arr = current?.array ?? array;
    // Reconstruct id mapping: find each value's original index by tracking moves.
    // Simple approach: reorder by value with a multiset match.
    const ids = initialItems.map((x) => x.id);
    const used = new Array(initialItems.length).fill(false);
    return arr.map((v) => {
      const idx = initialItems.findIndex((x, i) => !used[i] && x.value === v);
      if (idx >= 0) {
        used[idx] = true;
        return { id: ids[idx], value: v };
      }
      return { id: Math.random(), value: v };
    });
  }, [current, array, initialItems]);

  const max = Math.max(...array, 1);

  const shuffle = (n = size) => {
    setArray(randomArray(n));
  };

  const applyCustom = () => {
    const parts = custom
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (parts.length >= 2) {
      setArray(parts.slice(0, 80));
      setSize(parts.length);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sorting</h1>
          <p className="text-sm text-muted-foreground">
            Compare-and-swap visualizations with animated reordering.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SORTERS) as SortName[]).map((name) => (
            <button
              key={name}
              onClick={() => setAlgo(name)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                algo === name
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex h-[360px] items-end gap-[2px]">
          {display.map((item, i) => {
            const isCompare = current?.compare?.includes(i);
            const isSwap = current?.swap?.includes(i);
            const isSorted = current?.sorted?.includes(i);
            const isPivot = current?.pivot === i;
            const color = isSwap
              ? "var(--danger)"
              : isPivot
              ? "var(--warn)"
              : isCompare
              ? "var(--primary)"
              : isSorted
              ? "var(--accent)"
              : "oklch(0.78 0.02 256)";
            return (
              <motion.div
                key={item.id}
                layout
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="flex-1 rounded-t-sm"
                style={{ height: `${(item.value / max) * 100}%`, background: color }}
                title={String(item.value)}
              />
            );
          })}
        </div>
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

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="text-sm font-medium">Array size: {size}</label>
          <input
            type="range"
            min={5}
            max={80}
            value={size}
            onChange={(e) => {
              const n = Number(e.target.value);
              setSize(n);
              shuffle(n);
            }}
            className="w-full accent-primary"
          />
          <button
            onClick={() => shuffle()}
            className="h-9 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            Shuffle
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="text-sm font-medium">Custom data (comma-separated)</label>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 12, 5, 33, 8, 21"
              className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm"
            />
            <button
              onClick={applyCustom}
              className="h-9 px-3 rounded-md text-sm font-medium border border-border bg-card hover:bg-muted"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}