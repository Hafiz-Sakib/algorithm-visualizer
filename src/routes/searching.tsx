import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Controls } from "../components/viz/Controls";
import { binarySearch, linearSearch, type SearchStep } from "../lib/algorithms/searching";
import { usePlayer } from "../lib/usePlayer";

export const Route = createFileRoute("/searching")({
  head: () => ({
    meta: [
      { title: "Searching Visualizer — AlgoViz" },
      { name: "description", content: "Animated linear and binary search." },
    ],
  }),
  component: SearchingPage,
});

const randomArray = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 99) + 1);

type Algo = "Linear" | "Binary";

function SearchingPage() {
  const [algo, setAlgo] = useState<Algo>("Binary");
  const [size, setSize] = useState(20);
  const [speed, setSpeed] = useState(70);
  const [array, setArray] = useState<number[]>(() =>
    randomArray(20).sort((a, b) => a - b),
  );
  const [target, setTarget] = useState(() => array[Math.floor(array.length / 2)]);
  const [custom, setCustom] = useState("");

  const gen = useCallback(
    () =>
      algo === "Linear"
        ? linearSearch(array, target)
        : binarySearch(array, target),
    [algo, array, target],
  );
  const { current, index, total, play, pause, reset, stepFwd, stepBack, playing } =
    usePlayer(gen, speed);
  const step: SearchStep | undefined = current;

  const resetData = (n = size, sorted = algo === "Binary") => {
    const a = randomArray(n);
    if (sorted) a.sort((x, y) => x - y);
    setArray(a);
    setTarget(a[Math.floor(a.length / 2)]);
  };

  const applyCustom = () => {
    const parts = custom
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    if (parts.length >= 2) {
      const a = algo === "Binary" ? [...parts].sort((x, y) => x - y) : parts;
      setArray(a);
      setSize(a.length);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Searching</h1>
          <p className="text-sm text-muted-foreground">
            Watch the pointer narrow in on the target.
          </p>
        </div>
        <div className="flex gap-2">
          {(["Linear", "Binary"] as Algo[]).map((name) => (
            <button
              key={name}
              onClick={() => {
                setAlgo(name);
                if (name === "Binary") setArray((a) => [...a].sort((x, y) => x - y));
              }}
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

      <div className="rounded-xl border border-border bg-card p-6 overflow-x-auto">
        <div className="flex gap-1.5 min-w-fit">
          {array.map((v, i) => {
            const isCheck = step?.checking === i;
            const isFound = step?.found === i;
            const isElim = step?.eliminated?.includes(i);
            const inRange =
              step?.range && i >= step.range[0] && i <= step.range[1];
            const color = isFound
              ? "var(--accent)"
              : isCheck
              ? "var(--primary)"
              : isElim
              ? "oklch(0.92 0.01 256)"
              : inRange
              ? "oklch(0.97 0.02 255)"
              : "var(--card)";
            const text = isElim ? "text-muted-foreground" : "text-foreground";
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: isCheck || isFound ? 1.12 : 1,
                  y: isCheck ? -6 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className={`relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg border border-border ${text} font-mono text-sm`}
                style={{ background: color }}
              >
                {v}
                {isCheck && (
                  <span className="absolute -top-5 text-[10px] font-semibold text-primary">
                    ↓
                  </span>
                )}
                {isFound && (
                  <span className="absolute -top-5 text-[10px] font-semibold text-accent">
                    ✓
                  </span>
                )}
              </motion.div>
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

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="text-sm font-medium">Size: {size}</label>
          <input
            type="range"
            min={5}
            max={40}
            value={size}
            onChange={(e) => {
              const n = Number(e.target.value);
              setSize(n);
              resetData(n);
            }}
            className="w-full accent-primary"
          />
          <button
            onClick={() => resetData()}
            className="h-9 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            New data
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="text-sm font-medium">Target</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="text-sm font-medium">Custom data</label>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="3, 8, 12, 21, 34"
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