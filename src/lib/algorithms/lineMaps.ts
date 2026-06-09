// Maps a runtime visualizer step to highlighted Python source lines.
// Line numbers are 1-indexed relative to each snippet in `python.ts`.
// Where no detector exists we return [] and the code panel just renders plain.

import type { PySection } from "./python";

type StepFn = (step: any) => number[];

const has = (s: any, k: string) => s && Object.prototype.hasOwnProperty.call(s, k);
const m = (s: any) => (s?.message ?? "") as string;

// ────────────────────────────── SORTING ──────────────────────────────
const SORTING: Record<string, StepFn> = {
  Bubble: (s) => {
    if (s?.swap) return [8];
    if (s?.compare) return [7];
    if (s?.sorted?.length) return [12];
    return [4];
  },
  Selection: (s) => {
    if (s?.swap) return [9];
    if (s?.compare) return [7];
    return [4, 5];
  },
  Insertion: (s) => {
    if (s?.swap) return [7, 8];
    if (s?.compare) return [6];
    return [3, 4];
  },
  Merge: (s) => {
    if (s?.swap) return [13];
    if (s?.compare) return [10, 11];
    return [6, 7];
  },
  Quick: (s) => {
    if (s?.swap && has(s, "pivot") === false) return [20];
    if (s?.swap) return [19];
    if (s?.compare) return [17, 18];
    if (has(s, "pivot")) return [14];
    return [];
  },
  Heap: (s) => {
    if (s?.swap?.[0] === 0) return [7];
    if (s?.swap) return [13];
    if (s?.compare) return [16, 18];
    return [];
  },
  Shell: (s) => (s?.swap ? [9, 10] : s?.compare ? [8] : [4]),
  Counting: (s) => (s?.swap ? [12] : s?.compare ? [7] : []),
  Radix: (s) => (s?.swap ? [16] : s?.compare ? [8, 9] : []),
  Cocktail: (s) => (s?.swap ? [9, 17] : s?.compare ? [8, 16] : []),
  Gnome: (s) => (s?.swap ? [8] : s?.compare ? [4, 5] : []),
  Comb: (s) => (s?.swap ? [11] : s?.compare ? [10] : []),
  Cycle: (s) => (s?.swap ? [11, 16] : []),
};

// ────────────────────────────── SEARCHING ──────────────────────────────
const SEARCHING: Record<string, StepFn> = {
  Linear: (s) => {
    if (has(s, "found")) return [3, 4];
    if (has(s, "checking")) return [3];
    return [];
  },
  Binary: (s) => {
    if (has(s, "found")) return [5, 6];
    if (has(s, "checking")) return [4, 5, 7];
    return [];
  },
  Jump: (s) => {
    if (has(s, "found")) return [11, 12];
    if (has(s, "checking")) return [6, 10];
    return [];
  },
  Exponential: (s) => {
    if (has(s, "found")) return [11, 15];
    if (has(s, "checking")) return [9, 13];
    return [];
  },
  Ternary: (s) => {
    if (has(s, "found")) return [7, 9];
    if (has(s, "checking")) return [5, 6];
    return [];
  },
  Interpolation: (s) => {
    if (has(s, "found")) return [8, 9];
    if (has(s, "checking")) return [7];
    return [];
  },
};

// ────────────────────────────── STRINGS ──────────────────────────────
const STRINGS: Record<string, StepFn> = {
  Naive: (s) => {
    const msg = m(s);
    if (msg.startsWith("✓")) return [9, 10];
    if (msg.startsWith("Match:")) return [7, 8];
    if (msg.startsWith("Mismatch")) return [7];
    if (msg.startsWith("Window")) return [5, 6];
    return [];
  },
  KMP: (s) => {
    const msg = m(s);
    if (msg.startsWith("Failure")) return [16, 22];
    if (msg.startsWith("✓")) return [8, 9];
    if (msg.includes("=")) return [6, 7];
    if (msg.startsWith("KMP:")) return [16];
    return [];
  },
  "Rabin-Karp": (s) => {
    const msg = m(s);
    if (msg.startsWith("Pattern hash")) return [8, 9, 10];
    if (msg.startsWith("✓")) return [13, 14];
    if (msg.startsWith("Hash collision")) return [13];
    if (msg.startsWith("Window")) return [12];
    return [];
  },
  "Z-Algorithm": (s) => {
    const msg = m(s);
    if (msg.startsWith("Z[") && msg.includes("match")) return [13, 15];
    if (msg.startsWith("Z[")) return [10, 11];
    return [];
  },
};

// ────────────────────────────── TREE ──────────────────────────────
const TREE: Record<string, StepFn> = {
  BFS: (s) => (has(s, "visiting") ? [9, 10, 11] : [7, 8]),
  "DFS-In": (s) => (has(s, "visiting") ? [6, 7] : [4, 5]),
  "DFS-Pre": (s) => (has(s, "visiting") ? [7, 8] : [9, 10]),
  "DFS-Post": (s) => (has(s, "visiting") ? [11] : [7, 8, 9]),
};

// ────────────────────────────── GRAPH ──────────────────────────────
const GRAPH: Record<string, StepFn> = {
  BFS: (s) => {
    if (has(s, "visiting")) return [7, 8];
    if (s?.highlight?.length) return [9, 10, 11, 12];
    return [];
  },
  DFS: (s) => {
    if (has(s, "visiting")) return [5, 6, 7];
    if (s?.highlight?.length) return [9, 10, 11];
    return [];
  },
  Dijkstra: (s) => {
    if (has(s, "visiting")) return [7, 8];
    if (s?.highlight?.length) return [10, 11, 12, 13, 14];
    return [];
  },
  "Topological Sort": (s) => {
    if (has(s, "visiting")) return [11, 12];
    if (s?.highlight?.length) return [13, 14, 15, 16];
    return [];
  },
  "Cycle Detection": (s) => {
    const msg = m(s);
    if (msg.includes("cycle") || msg.includes("back")) return [9];
    if (has(s, "visiting")) return [7];
    return [];
  },
  "Prim MST": (s) => {
    if (s?.highlight?.length) return [11, 12, 13];
    if (has(s, "visiting")) return [9, 10];
    return [];
  },
};

// ────────────────────────────── PATHFINDING ──────────────────────────────
const PATHFINDING: Record<string, StepFn> = {
  BFS: (s) => {
    if (s?.path?.length) return [10, 11];
    if (s?.current) return [9, 10];
    if (s?.frontier?.length) return [12, 13, 14, 15, 16, 17];
    return [];
  },
  Dijkstra: (s) => {
    if (s?.path?.length) return [12, 13];
    if (s?.current) return [11, 12];
    if (s?.frontier?.length) return [16, 17, 18, 19, 20, 21, 22, 23];
    return [];
  },
  "A*": (s) => {
    if (s?.path?.length) return [13, 14];
    if (s?.current) return [12, 13];
    if (s?.frontier?.length) return [17, 18, 19, 20, 21, 22, 23, 24];
    return [];
  },
};

// ────────────────────────────── DP ──────────────────────────────
const DP: Record<string, StepFn> = {
  Fibonacci: (s) => {
    const msg = m(s);
    if (msg.startsWith("Initialize")) return [3, 4, 5, 6];
    if (msg.startsWith("fib(")) return [7, 8];
    return [9];
  },
  LCS: (s) => {
    const msg = m(s);
    if (msg.startsWith("Initialize")) return [3, 4];
    if (msg.includes("→ dp[") && msg.includes("+1")) return [7, 8];
    if (msg.includes("max(")) return [9, 10];
    if (msg.startsWith("LCS length")) return [11];
    return [];
  },
  "0/1 Knapsack": (s) => {
    const msg = m(s);
    if (msg.startsWith("Initialize")) return [3, 4];
    if (msg.includes("too heavy")) return [7];
    if (msg.startsWith("Item ")) return [8, 9, 10, 11, 12];
    if (msg.startsWith("Max value")) return [13];
    return [];
  },
  "Edit Distance": (s) => {
    const msg = m(s);
    if (msg.startsWith("Initialize")) return [5, 6];
    if (msg.includes("no cost")) return [9, 10];
    if (msg.includes("min(del")) return [11, 12, 13, 14, 15, 16];
    if (msg.startsWith("Edit distance")) return [17];
    return [];
  },
  "Coin Change": (s) => {
    const msg = m(s);
    if (msg.startsWith("dp[0]")) return [4];
    if (msg.includes("unreachable")) return [5, 6, 7];
    if (msg.startsWith("dp[")) return [5, 6, 7, 8];
    return [9];
  },
  LIS: (s) => {
    const msg = m(s);
    if (msg.startsWith("Init")) return [5, 6];
    if (msg.includes(">")) return [7, 8, 9];
    if (msg.startsWith("LIS length")) return [10];
    return [];
  },
};

const SECTIONS: Record<PySection, Record<string, StepFn>> = {
  sorting: SORTING,
  searching: SEARCHING,
  strings: STRINGS,
  tree: TREE,
  graph: GRAPH,
  pathfinding: PATHFINDING,
  dp: DP,
};

export function inferLines(
  section: PySection,
  algo: string,
  step: any,
): number[] {
  const det = SECTIONS[section]?.[algo];
  if (!det || !step) return [];
  try {
    return det(step) ?? [];
  } catch {
    return [];
  }
}
