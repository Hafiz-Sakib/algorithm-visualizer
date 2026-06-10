import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { PythonCodePanel } from "../components/PythonCodePanel";
import { PYTHON_CODES } from "../lib/algorithms/python";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Algorithm Library — AlgoViz" },
      { name: "description", content: "Fifteen extra classic algorithms — Boyer-Moore, Manacher, Sieve, Segment Tree, Kosaraju SCC and more — with full C++ STL source." },
    ],
  }),
  component: LibraryPage,
});

const ALGOS = Object.keys(PYTHON_CODES.library) as Array<keyof typeof PYTHON_CODES.library>;

const CATEGORIES: Record<string, string> = {
  "Boyer-Moore": "Strings",
  "Manacher": "Strings",
  "Sieve of Eratosthenes": "Math",
  "Euclidean GCD": "Math",
  "Fast Modular Exponentiation": "Math",
  "Matrix Chain Multiplication": "DP",
  "Rod Cutting": "DP",
  "Subset Sum": "DP",
  "Union-Find (DSU)": "Data Structures",
  "Fenwick Tree (BIT)": "Data Structures",
  "Segment Tree": "Data Structures",
  "Kosaraju SCC": "Graph",
  "Tarjan Bridges": "Graph",
  "Bipartite Check": "Graph",
  "Morris Traversal": "Tree",
};

const ACCENT = "oklch(0.75 0.18 162)";

function LibraryPage() {
  const [algo, setAlgo] = useState<string>(ALGOS[0]);
  const snippet = PYTHON_CODES.library[algo as keyof typeof PYTHON_CODES.library];

  return (
    <div className="space-y-6 py-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" style={{ color: ACCENT }}>📚</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Algorithm Library</h1>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Fifteen extra classic algorithms with clean, idiomatic C++ STL implementations.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded-full"
          style={{ background: "oklch(1 0 0 / 5%)", border: "1px solid oklch(1 0 0 / 10%)", color: "oklch(0.7 0.04 255)" }}>
          {ALGOS.length} algorithms
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* Sidebar list */}
        <div className="rounded-2xl p-2 overflow-y-auto max-h-[70vh]"
          style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}>
          {ALGOS.map((name) => {
            const active = name === algo;
            return (
              <motion.button
                key={name}
                onClick={() => setAlgo(name)}
                whileHover={{ x: 4 }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm flex flex-col gap-0.5 transition-all"
                style={{
                  background: active ? "oklch(0.75 0.18 162 / 14%)" : "transparent",
                  borderLeft: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                }}
              >
                <span className="font-semibold" style={{ color: active ? "oklch(0.95 0.01 255)" : "oklch(0.78 0.02 255)" }}>{name}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: active ? ACCENT : "oklch(0.45 0.04 255)" }}>
                  {CATEGORIES[name]}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Code panel */}
        <motion.div key={algo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-lg font-bold tracking-tight">{algo}</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${ACCENT}18`, color: ACCENT }}>{CATEGORIES[algo]}</span>
            <span className="text-xs font-mono" style={{ color: "oklch(0.55 0.04 255)" }}>
              {snippet.time} · {snippet.space}
            </span>
          </div>
          <PythonCodePanel section="library" algo={algo} accentColor={ACCENT} />
        </motion.div>
      </div>
    </div>
  );
}
