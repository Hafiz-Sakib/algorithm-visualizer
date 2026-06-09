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
  const progress = total > 1 ? (index / (total - 1)) * 100 : 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.12 0.025 265)", border: "1px solid oklch(1 0 0 / 8%)" }}>
      {/* Progress bar */}
      <div className="h-[2px] w-full" style={{ background: "oklch(1 0 0 / 8%)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, oklch(0.72 0.19 255), oklch(0.75 0.18 162))", width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Step back */}
        <button
          onClick={onStepBack}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-105"
          style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.04 255)", border: "1px solid oklch(1 0 0 / 8%)" }}
          title="Step back"
        >
          ◀
        </button>

        {/* Play/Pause */}
        {playing ? (
          <button
            onClick={onPause}
            className="h-8 px-4 rounded-lg text-sm font-semibold transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)", boxShadow: "0 0 16px oklch(0.72 0.19 255 / 25%)" }}
          >
            <span className="flex gap-[3px] items-center">
              <span className="block w-[3px] h-[12px] rounded-full bg-current" />
              <span className="block w-[3px] h-[12px] rounded-full bg-current" />
            </span>
            Pause
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onPlay}
            className="h-8 px-4 rounded-lg text-sm font-semibold transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)", boxShadow: "0 0 16px oklch(0.72 0.19 255 / 25%)" }}
          >
            <span className="border-l-[10px] border-y-[6px] border-y-transparent border-l-current" style={{ borderLeftColor: "currentColor" }} />
            Play
          </motion.button>
        )}

        {/* Step fwd */}
        <button
          onClick={onStepFwd}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-105"
          style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.04 255)", border: "1px solid oklch(1 0 0 / 8%)" }}
          title="Step forward"
        >
          ▶
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="h-8 px-3 rounded-lg text-sm font-medium transition-all hover:scale-105"
          style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.04 255)", border: "1px solid oklch(1 0 0 / 8%)" }}
        >
          ↺ Reset
        </button>

        {/* Speed */}
        <div className="flex items-center gap-2 ml-1">
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "oklch(0.50 0.04 255)" }}>Speed</span>
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20 sm:w-28"
          />
          <span className="text-[10px] font-mono w-5 text-right" style={{ color: "oklch(0.65 0.04 255)" }}>{speed}</span>
        </div>

        {/* Step counter */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ background: "oklch(1 0 0 / 5%)", color: "oklch(0.55 0.04 255)" }}>
            {index + 1} <span style={{ color: "oklch(0.40 0.04 255)" }}>/</span> {total}
          </span>
        </div>

        {extra}
      </div>
    </div>
  );
}
