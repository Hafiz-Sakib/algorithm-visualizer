import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Controls({
  playing,
  onPlay,
  onPause,
  onReset,
  onStepBack,
  onStepFwd,
  speed,
  setSpeed,
  index,
  total,
  extra,
}: {
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepFwd: () => void;
  speed: number;
  setSpeed: (n: number) => void;
  index: number;
  total: number;
  extra?: ReactNode;
}) {
  const btn =
    "h-9 px-3 rounded-md text-sm font-medium border border-border bg-card hover:bg-muted transition-colors";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
      <button className={btn} onClick={onStepBack}>◀ Step</button>
      {playing ? (
        <button
          className="h-9 px-4 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90"
          onClick={onPause}
        >
          Pause
        </button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="h-9 px-4 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90"
          onClick={onPlay}
        >
          Play
        </motion.button>
      )}
      <button className={btn} onClick={onStepFwd}>Step ▶</button>
      <button className={btn} onClick={onReset}>Reset</button>
      <div className="flex items-center gap-2 ml-2">
        <label className="text-xs text-muted-foreground">Speed</label>
        <input
          type="range"
          min={1}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="accent-primary"
        />
      </div>
      <div className="ml-auto text-xs text-muted-foreground tabular-nums">
        Step {index + 1} / {total}
      </div>
      {extra}
    </div>
  );
}