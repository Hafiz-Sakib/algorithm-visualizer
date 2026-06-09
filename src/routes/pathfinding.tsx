import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Controls } from "../components/viz/Controls";
import { PATHFINDERS, type Grid, type PathName } from "../lib/algorithms/pathfinding";
import { usePlayer } from "../lib/usePlayer";

export const Route = createFileRoute("/pathfinding")({
  head: () => ({
    meta: [
      { title: "Pathfinding Visualizer — AlgoViz" },
      { name: "description", content: "BFS, Dijkstra, and A* on an editable grid." },
    ],
  }),
  component: PathfindingPage,
});

const ROWS = 18;
const COLS = 32;
const k = (r: number, c: number) => `${r},${c}`;

const emptyGrid = (): Grid =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));

const randomWalls = (g: Grid, density = 0.25): Grid =>
  g.map((row) => row.map(() => (Math.random() < density ? 1 : 0)));

type Tool = "wall" | "start" | "end" | "erase";

function PathfindingPage() {
  const [algo, setAlgo] = useState<PathName>("A*");
  const [speed, setSpeed] = useState(85);
  const [grid, setGrid] = useState<Grid>(() => emptyGrid());
  const [start, setStart] = useState({ r: 4, c: 4 });
  const [end, setEnd] = useState({ r: 12, c: 26 });
  const [tool, setTool] = useState<Tool>("wall");
  const [drag, setDrag] = useState(false);

  const gen = useCallback(
    () => PATHFINDERS[algo](grid, start, end),
    [algo, grid, start, end],
  );
  const { current, index, total, play, pause, reset, stepFwd, stepBack, playing } =
    usePlayer(gen, speed);

  const visited = useMemo(() => new Set(current?.visited ?? []), [current]);
  const frontier = useMemo(() => new Set(current?.frontier ?? []), [current]);
  const path = useMemo(() => new Set(current?.path ?? []), [current]);
  const cur = current?.current;

  const apply = (r: number, c: number) => {
    if (tool === "start") return setStart({ r, c });
    if (tool === "end") return setEnd({ r, c });
    setGrid((g) =>
      g.map((row, ri) =>
        ri === r
          ? row.map((v, ci) => (ci === c ? (tool === "erase" ? 0 : 1) : v))
          : row,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pathfinding</h1>
          <p className="text-sm text-muted-foreground">
            Click cells to draw walls. Drag to paint.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PATHFINDERS) as PathName[]).map((name) => (
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

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
        {(["wall", "erase", "start", "end"] as Tool[]).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`px-3 py-1.5 rounded-md text-sm border capitalize transition-colors ${
              tool === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setGrid(randomWalls(emptyGrid()))}
            className="px-3 py-1.5 rounded-md text-sm border border-border bg-background hover:bg-muted"
          >
            Random walls
          </button>
          <button
            onClick={() => setGrid(emptyGrid())}
            className="px-3 py-1.5 rounded-md text-sm border border-border bg-background hover:bg-muted"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border border-border bg-card p-2 overflow-x-auto select-none"
        onMouseLeave={() => setDrag(false)}
        onMouseUp={() => setDrag(false)}
      >
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, minWidth: COLS * 18 }}
        >
          {grid.map((row, r) =>
            row.map((v, c) => {
              const key = k(r, c);
              const isStart = start.r === r && start.c === c;
              const isEnd = end.r === r && end.c === c;
              const isWall = v === 1;
              const inPath = path.has(key);
              const isCur = cur === key;
              const isFront = frontier.has(key);
              const isVisited = visited.has(key);
              let bg = "oklch(0.985 0 0)";
              if (isVisited) bg = "oklch(0.92 0.05 255)";
              if (isFront) bg = "oklch(0.85 0.08 200)";
              if (inPath) bg = "var(--warn)";
              if (isCur) bg = "var(--primary)";
              if (isWall) bg = "oklch(0.25 0.02 256)";
              if (isStart) bg = "var(--accent)";
              if (isEnd) bg = "var(--danger)";
              return (
                <motion.div
                  key={key}
                  initial={false}
                  animate={{ backgroundColor: bg, scale: isCur ? 1.08 : 1 }}
                  transition={{ duration: 0.15 }}
                  onMouseDown={() => {
                    setDrag(true);
                    apply(r, c);
                  }}
                  onMouseEnter={() => drag && apply(r, c)}
                  className="aspect-square rounded-[3px] cursor-pointer border border-border/40"
                />
              );
            }),
          )}
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

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend color="var(--accent)" label="Start" />
        <Legend color="var(--danger)" label="End" />
        <Legend color="oklch(0.25 0.02 256)" label="Wall" />
        <Legend color="oklch(0.92 0.05 255)" label="Visited" />
        <Legend color="oklch(0.85 0.08 200)" label="Frontier" />
        <Legend color="var(--warn)" label="Path" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm border border-border" style={{ background: color }} />
      {label}
    </span>
  );
}