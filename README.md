# AlgoViz — Interactive Algorithm Visualizer

AlgoViz is an interactive playground for classic computer-science algorithms. Every visualization is paired with the **matching C++ STL source code**, and the currently executing line lights up as you watch the animation step by step.

## ✨ What's new in this release

- **Syntax-highlighted C++ everywhere.** All code panels (every visualizer page and the Library) now ship with a lightweight, dependency-free C++ tokenizer that colours keywords, types, STL identifiers, strings, numbers, comments and operators — synced with the animation's active-line indicator.
- **Library expanded to 50+ algorithms.** Strings (KMP, Aho-Corasick, Suffix Array, Trie …), Math (Linear Sieve, Miller-Rabin, Pollard's Rho, Matrix Exponentiation …), DP (LCS, LIS, Kadane, 0/1 & Unbounded Knapsack, Catalan …), Graph (Dijkstra, Bellman-Ford, Tarjan SCC, Articulation Points, Hopcroft-Karp, Edmonds-Karp …), Data Structures (DSU, Fenwick, Segment Tree, Sparse Table, Treap, LRU, Monotonic Stack …), Tree (LCA Binary Lifting, HLD, Euler Tour, Morris), Sorting (Counting, Radix, Bucket), Geometry (Convex Hull), and more.
- **Detailed explanations on every Library entry.** Each algorithm now includes *How it works*, *When to use it*, *Time & Space complexity*, and a *worked example*.
- **Mobile-first Library page.** Search bar, category chips, sidebar list, code panel and explanation pane each scroll independently — the page itself no longer jumps when you scroll long code on a phone.
- **Better Copy / Download buttons** with lucide icons, explicit labels and accent colours that fit the dark UI.
- **New 3D BFS / DFS scene on the homepage.** A small graph laid out on a sphere; toggle between BFS and DFS, drag to orbit the camera, and watch the traversal expand in real time with edge highlighting.
- **Polished dropdowns on N-Queens and Knight's Tour** so they finally match the dark theme.

## Tech stack

- React 19 + TanStack Start (Vite 7, file-based routing under `src/routes/`)
- Tailwind v4 (CSS-first design tokens in `src/styles.css`)
- Framer Motion for animations
- Three.js for the homepage 3D scenes (Quick Sort / Binary Search, A* pathfinding, BFS/DFS graph)
- Lucide React for iconography
- Zero new runtime dependencies for syntax highlighting — a small custom tokenizer ships in `src/lib/cppHighlight.ts`

## Project layout

```
src/
├── components/
│   ├── GraphTraversal3D.tsx   ← new 3D BFS/DFS scene
│   ├── Nav.tsx
│   ├── PythonCodePanel.tsx    ← now with syntax highlighting & icon buttons
│   └── viz/Controls.tsx
├── lib/
│   ├── cppHighlight.ts        ← lightweight C++ tokenizer (no deps)
│   └── algorithms/
│       ├── libraryData.ts     ← 50+ algorithms + explanations
│       └── python.ts          ← per-visualizer C++ snippets
└── routes/
    ├── library.tsx            ← rebuilt mobile-friendly Library
    ├── nqueens.tsx, knights.tsx (dark-themed dropdowns)
    └── … (visualizer pages)
```

## Running locally

```bash
bun install
bun run dev
```

Open <http://localhost:5173>.

Build:

```bash
bun run build
```

## Adding a Library algorithm

Open `src/lib/algorithms/libraryData.ts` and append an entry:

```ts
"My Algorithm": entry(
  "Category",     // Strings | Math | DP | Graph | Tree | Data Structures | …
  "O(n log n)",   // time
  "O(n)",         // space
  `#include <bits/stdc++.h>\n…`,  // C++ source
  {
    howItWorks: "Short paragraph.",
    whenToUse: ["Use case 1", "Use case 2"],
    example: "Concrete input → output walkthrough.",
  },
),
```

It will immediately appear in the Library sidebar, searchable by name / category / keyword.

## License

MIT — see source headers.
