# AlgoViz — Interactive Algorithm Visualizer with C++ Source

> Step through 60+ classic algorithms in real-time and read the matching C++ STL implementation line-by-line as it runs.

AlgoViz is a single-page application built with **TanStack Start v1**, **React 19**, **Tailwind CSS v4**, **Framer Motion** and **Three.js**. Every visualization is paired with a clean, well-commented C++/STL reference implementation that highlights the currently-executing line as the animation plays.

---

## ✨ Features

- 🎞 **60+ algorithms** across 11 categories (sorting, searching, graphs, trees, pathfinding, DP, strings, backtracking, math, data structures, library).
- 🧊 **Three.js hero** — a 3-D visualizer that animates **Quick Sort** *and* **Binary Search** (toggle in the top-right of the canvas). Slowed-down playback, drag-to-rotate, click-to-restart.
- 📈 **Big-O Playground** — interactive complexity chart with **mouse-wheel zoom** and **hover tooltips** showing live values for O(1), O(log n), O(n), O(n log n) and O(n²).
- 🏁 **Live Sort Race** — compares Bubble / Insertion / Selection / Quick on the same random seed.
- 🔦 **Algorithm Spotlight** — auto-rotating cards.
- 📊 **Complexity table**, animated **pseudocode stepper**, **algorithm timeline**.
- 🛠 **Synced C++ code panel** — line numbers light up while the animation runs; one-click copy / download.
- 🎨 **Fancy animated 404** — BFS-ripple canvas + glitch text + scanline overlay.

---

## 🧠 Algorithms covered

### Sorting (13)
Bubble · Selection · Insertion · Merge · **Quick** · Heap · Shell · Counting · Radix · Cocktail · Gnome · Comb · Cycle

### Searching (6)
Linear · **Binary** · Jump · Exponential · Ternary · Interpolation

### Graph (9)
DFS · BFS · Topological Sort · Cycle Detection · **Dijkstra** · **Bellman-Ford** · **Floyd-Warshall** · **Prim MST** · **Kruskal MST**

### Pathfinding (3)
BFS · Dijkstra · **A\***

### Trees (4) · Strings (4) · DP (6) · Backtracking (3)
BFS / DFS-In / Pre / Post  ·  Naive / KMP / Rabin-Karp / Z-Algorithm  ·  Fibonacci / LCS / Knapsack / Edit Distance / Coin Change / LIS  ·  N-Queens / Knight's Tour / Tower of Hanoi

### Library (15 new — C++ reference only)
Boyer-Moore · Manacher · Sieve of Eratosthenes · Euclidean GCD (with ext-gcd) · Fast Modular Exponentiation · Matrix Chain Multiplication · Rod Cutting · Subset Sum · Union-Find (DSU) · Fenwick Tree (BIT) · Segment Tree · Kosaraju SCC · Tarjan Bridges · Bipartite Check · Morris Inorder Traversal

---

## 🚀 Getting started

```bash
# 1. install
npm install        # (or: bun install / pnpm install)

# 2. run dev server
npm run dev        # → http://localhost:5173

# 3. production build
npm run build
npm run start
```

> ℹ️ The repo also works with `bun`; a `bunfig.toml` is included. If you prefer bun:
> `bun install && bun run dev`.

---

## 🗂 Project structure

```
algorithm-visualizer-main/
├── public/                       static assets, icons, manifest
├── src/
│   ├── components/
│   │   ├── Nav.tsx               sticky top nav
│   │   ├── PythonCodePanel.tsx   C++ code viewer (line-highlight + copy)
│   │   └── viz/Controls.tsx      shared player controls
│   ├── hooks/                    React helpers
│   ├── lib/
│   │   ├── algorithms/
│   │   │   ├── sorting.ts        sort generators (yield steps)
│   │   │   ├── searching.ts
│   │   │   ├── tree.ts
│   │   │   ├── graph.ts          + Bellman-Ford / Floyd-Warshall / Kruskal
│   │   │   ├── pathfinding.ts    BFS / Dijkstra / A* on a grid
│   │   │   ├── dp.ts
│   │   │   ├── strings.ts
│   │   │   ├── backtracking.ts
│   │   │   ├── lineMaps.ts       step → C++ line mapper
│   │   │   └── python.ts         C++ snippets (despite filename)
│   │   ├── usePlayer.ts          play / pause / step machinery
│   │   └── …                     error reporting, utils
│   ├── routes/
│   │   ├── __root.tsx            shell + fancy 404
│   │   ├── index.tsx             homepage (Three.js + Big-O playground + 5 new sections)
│   │   ├── sorting.tsx · searching.tsx · graph.tsx · tree.tsx
│   │   ├── pathfinding.tsx · dp.tsx · strings.tsx
│   │   ├── nqueens.tsx · knights.tsx · hanoi.tsx
│   │   └── library.tsx           NEW – 15 extra algorithms with C++
│   ├── styles.css                Tailwind v4 + glitch / scanline keyframes
│   └── router.tsx · server.ts · start.ts
├── package.json · vite.config.ts · tsconfig.json
└── README.md
```

---

## 🧩 Tech stack

| Layer       | Choice                                        |
| ----------- | --------------------------------------------- |
| Framework   | TanStack Start v1 (React 19, Vite 7, SSR-ready) |
| Styling     | Tailwind CSS v4 (CSS-first via `src/styles.css`) |
| Animations  | Framer Motion (sections), Three.js (hero)     |
| State       | TanStack Query, custom `usePlayer` hook        |
| C++ code    | Plain strings, line-highlighted at runtime    |
| Deploy      | Designed for Cloudflare Workers (workerd)     |

---

## 🔧 Adding a new algorithm

1. **Implement a generator** in `src/lib/algorithms/<section>.ts` that `yield`s step objects describing what to render.
2. **Register** the algorithm in that file's `*_ALGOS` map and its type union.
3. **Map steps → C++ source lines** in `src/lib/algorithms/lineMaps.ts`.
4. **Add the C++ snippet** to `src/lib/algorithms/python.ts` under the matching section.
5. The corresponding `src/routes/<section>.tsx` page will pick it up automatically.

For non-visualized algorithms (math, data structures, advanced graph), drop the C++ snippet into the `library` section of `python.ts` and update `CATEGORIES` in `src/routes/library.tsx`.

---

## 🧰 Scripts

| Script            | Purpose                              |
| ----------------- | ------------------------------------ |
| `npm run dev`     | start Vite dev server                |
| `npm run build`   | production build                     |
| `npm run start`   | run the built server                 |
| `npm run lint`    | ESLint                               |

---

## 📝 License

MIT — fork, learn, teach, contribute.

Made with ❤ for everyone trying to understand algorithms.
