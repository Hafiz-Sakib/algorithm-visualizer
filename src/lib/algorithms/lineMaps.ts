// Maps a runtime visualizer step to highlighted C++ source lines.
// Line numbers are 1-indexed relative to each snippet in `python.ts`.
// The detectors below are intentionally conservative for the C++ snippets:
// each one returns an empty array unless the message/state clearly identifies
// a known location, so we never highlight the wrong line.

import type { PySection } from "./python";

type StepFn = (step: any) => number[];

const has = (s: any, k: string) => s && Object.prototype.hasOwnProperty.call(s, k);
const m = (s: any) => (s?.message ?? "") as string;

// ────────────────────────────── SORTING (C++ STL) ──────────────────────────────
// Snippets begin with `#include <bits/stdc++.h>` + `using namespace std;`,
// pushing the algorithm body down a few lines.
const SORTING: Record<string, StepFn> = {
  Bubble: (s) => {
    if (s?.swap) return [11];                       // swap(a[j], a[j+1])
    if (s?.compare) return [10];                    // if (a[j] > a[j+1])
    if (s?.sorted?.length === (s?.array?.length ?? 0)) return [16];
    return [];
  },
  Selection: (s) => {
    if (s?.swap) return [11];                       // swap(a[i], a[mn])
    if (s?.compare) return [9, 10];                 // for + if (a[j] < a[mn])
    return [];
  },
  Insertion: (s) => {
    if (s?.swap) return [9, 10];                    // while shift loop
    if (s?.compare) return [9];                     // a[j] > key
    return [];
  },
  Merge: (s) => {
    if (s?.compare) return [9, 10];                 // merge compare
    if (s?.swap) return [10];
    return [];
  },
  Quick: (s) => {
    if (s?.swap && has(s, "pivot")) return [10];    // swap(++i, j)
    if (s?.swap) return [12];                       // swap pivot in place
    if (s?.compare) return [9, 10];
    if (has(s, "pivot")) return [6];                // pivot = a[hi]
    return [];
  },
  Heap: () => [],                                   // STL one-liner
  Shell: (s) => {
    if (s?.swap) return [10, 11];
    if (s?.compare) return [10];
    return [];
  },
  Counting: () => [],
  Radix: () => [],
  Cocktail: (s) => (s?.swap ? [12, 16] : []),
  Gnome: (s) => (s?.swap ? [9] : []),
  Comb: (s) => (s?.swap ? [12] : []),
  Cycle: () => [],
};

// ────────────────────────────── SEARCHING (C++ STL) ──────────────────────────────
const SEARCHING: Record<string, StepFn> = {
  Linear: (s) => {
    if (has(s, "found")) return [5, 6];
    if (has(s, "checking")) return [5];
    return [];
  },
  Binary: (s) => {
    if (has(s, "found")) return [9];
    if (has(s, "checking")) return [8, 10, 11];
    return [];
  },
  Jump: (s) => {
    if (has(s, "found")) return [12, 13];
    if (has(s, "checking")) return [7, 12];
    return [];
  },
  Exponential: (s) => {
    if (has(s, "found")) return [9, 14];
    if (has(s, "checking")) return [11, 13];
    return [];
  },
  Ternary: (s) => {
    if (has(s, "found")) return [9, 10];
    if (has(s, "checking")) return [7, 8];
    return [];
  },
  Interpolation: (s) => {
    if (has(s, "found")) return [9];
    if (has(s, "checking")) return [9];
    return [];
  },
};

// ────────────────────────────── TREE ──────────────────────────────
const TREE: Record<string, StepFn> = {
  BFS: (s) => (has(s, "visiting") ? [10, 11] : []),
  "DFS-In": (s) => (has(s, "visiting") ? [9, 10] : []),
  "DFS-Pre": (s) => (has(s, "visiting") ? [10, 11] : []),
  "DFS-Post": (s) => (has(s, "visiting") ? [10, 11] : []),
};

// ────────────────────────────── GRAPH ──────────────────────────────
const GRAPH: Record<string, StepFn> = {
  BFS: (s) => {
    if (has(s, "visiting")) return [9, 10];
    if (s?.highlight?.length) return [11];
    return [];
  },
  DFS: (s) => {
    if (has(s, "visiting")) return [9, 10];
    if (s?.highlight?.length) return [11, 12];
    return [];
  },
  Dijkstra: (s) => {
    if (has(s, "visiting")) return [13, 14];
    if (s?.highlight?.length) return [15, 16, 17];
    return [];
  },
  "Topological Sort": (s) => {
    if (has(s, "visiting")) return [12, 13];
    return [];
  },
  "Cycle Detection": (s) => {
    const msg = m(s);
    if (msg.includes("cycle") || msg.includes("back")) return [6];
    return [];
  },
  "Prim MST": (s) => {
    if (has(s, "visiting")) return [10, 11];
    return [];
  },
};

// ────────────────────────────── PATHFINDING ──────────────────────────────
const PATHFINDING: Record<string, StepFn> = {
  BFS: (s) => {
    if (s?.path?.length) return [20, 21];
    if (s?.current) return [12, 13];
    return [];
  },
  Dijkstra: (s) => {
    if (s?.path?.length) return [25, 26];
    if (s?.current) return [16, 17];
    return [];
  },
  "A*": (s) => {
    if (s?.path?.length) return [29, 30];
    if (s?.current) return [19, 20];
    return [];
  },
};

// ────────────────────────────── DP ──────────────────────────────
const DP: Record<string, StepFn> = {
  Fibonacci: (s) => {
    const msg = m(s);
    if (msg.startsWith("Initialize")) return [6, 7];
    if (msg.startsWith("fib(")) return [9];
    return [];
  },
  LCS: () => [],
  "0/1 Knapsack": () => [],
  "Edit Distance": () => [],
  "Coin Change": () => [],
  LIS: () => [],
};

// ────────────────────────────── STRINGS ──────────────────────────────
const STRINGS: Record<string, StepFn> = {
  Naive: (s) => {
    const msg = m(s);
    if (msg.startsWith("✓")) return [9, 10];
    if (msg.startsWith("Match")) return [9];
    return [];
  },
  KMP: () => [],
  "Rabin-Karp": () => [],
  "Z-Algorithm": () => [],
};

const BACKTRACKING: Record<string, StepFn> = {};

const SECTIONS: Record<PySection, Record<string, StepFn>> = {
  sorting: SORTING,
  searching: SEARCHING,
  strings: STRINGS,
  tree: TREE,
  graph: GRAPH,
  pathfinding: PATHFINDING,
  dp: DP,
  backtracking: BACKTRACKING,
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
