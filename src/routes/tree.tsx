import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Controls } from "../components/viz/Controls";
import {
  buildBST,
  flatten,
  TRAVERSALS,
  type TraversalName,
} from "../lib/algorithms/tree";
import { usePlayer } from "../lib/usePlayer";

export const Route = createFileRoute("/tree")({
  head: () => ({
    meta: [
      { title: "Tree Traversal Visualizer — AlgoViz" },
      { name: "description", content: "BFS and DFS (in/pre/post) on a binary search tree." },
    ],
  }),
  component: TreePage,
});

const randomVals = (n: number) => {
  const set = new Set<number>();
  while (set.size < n) set.add(Math.floor(Math.random() * 99) + 1);
  return [...set];
};

function TreePage() {
  const [algo, setAlgo] = useState<TraversalName>("BFS");
  const [speed, setSpeed] = useState(70);
  const [values, setValues] = useState<number[]>(() => [50, 30, 70, 20, 40, 60, 80, 35, 65]);
  const [custom, setCustom] = useState("");

  const root = useMemo(() => buildBST(values), [values]);
  const nodes = useMemo(() => flatten(root), [root]);
  const maxX = Math.max(...nodes.map((n) => n.x), 1);
  const maxY = Math.max(...nodes.map((n) => n.y), 1);

  const gen = useCallback(() => TRAVERSALS[algo](root), [algo, root]);
  const { current, index, total, play, pause, reset, stepFwd, stepBack, playing } =
    usePlayer(gen, speed);

  const W = 700, H = 360, padX = 30, padY = 30;
  const xOf = (n: { x: number }) => padX + (n.x / Math.max(maxX, 1)) * (W - padX * 2);
  const yOf = (n: { y: number }) => padY + (n.y / Math.max(maxY, 1)) * (H - padY * 2);

  const visited = current?.visited ?? [];
  const visiting = current?.visiting;

  const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  const collect = (n?: typeof root) => {
    if (!n) return;
    if (n.left) {
      edges.push({ x1: xOf(n), y1: yOf(n), x2: xOf(n.left), y2: yOf(n.left), key: `${n.id}-${n.left.id}` });
      collect(n.left);
    }
    if (n.right) {
      edges.push({ x1: xOf(n), y1: yOf(n), x2: xOf(n.right), y2: yOf(n.right), key: `${n.id}-${n.right.id}` });
      collect(n.right);
    }
  };
  collect(root);

  const applyCustom = () => {
    const parts = custom
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    if (parts.length >= 1) setValues(parts.slice(0, 20));
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tree Traversals</h1>
          <p className="text-sm text-muted-foreground">Binary search tree built from your input.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TRAVERSALS) as TraversalName[]).map((name) => (
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

      <div className="rounded-xl border border-border bg-card p-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 420 }}>
          {edges.map((e) => (
            <line
              key={e.key}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="var(--border)"
              strokeWidth={2}
            />
          ))}
          {nodes.map((n) => {
            const isVisited = visited.includes(n.id);
            const isVisiting = visiting === n.id;
            const fill = isVisiting
              ? "var(--primary)"
              : isVisited
              ? "var(--accent)"
              : "var(--card)";
            const stroke = isVisiting || isVisited ? "transparent" : "var(--border)";
            const textColor = isVisiting || isVisited ? "var(--primary-foreground)" : "var(--foreground)";
            return (
              <motion.g
                key={n.id}
                animate={{ scale: isVisiting ? 1.18 : 1 }}
                style={{ originX: `${xOf(n)}px`, originY: `${yOf(n)}px` }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <circle cx={xOf(n)} cy={yOf(n)} r={20} fill={fill} stroke={stroke} strokeWidth={2} />
                <text
                  x={xOf(n)}
                  y={yOf(n) + 4}
                  textAnchor="middle"
                  fontSize={13}
                  fontFamily="monospace"
                  fill={textColor}
                >
                  {n.value}
                </text>
              </motion.g>
            );
          })}
        </svg>
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
          <label className="text-sm font-medium">Visit order</label>
          <div className="flex flex-wrap gap-1.5">
            {visited.map((id, i) => {
              const node = nodes.find((n) => n.id === id);
              return (
                <motion.span
                  key={`${id}-${i}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-mono"
                >
                  {node?.value}
                </motion.span>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <label className="text-sm font-medium">Build tree from values</label>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="50, 30, 70, 20, 40"
              className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm"
            />
            <button
              onClick={applyCustom}
              className="h-9 px-3 rounded-md text-sm font-medium border border-border bg-card hover:bg-muted"
            >
              Apply
            </button>
            <button
              onClick={() => setValues(randomVals(9))}
              className="h-9 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
            >
              Random
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}