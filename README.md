# AlgoViz — Interactive Algorithm Visualizer

A modern, interactive algorithm visualizer built with **TanStack Start**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Framer Motion** and **Three.js**. Every visualization is paired with a clean **C++ STL** reference implementation with line-by-line highlighting of the currently-executing step.

> Live, step-by-step animations for 45+ classic algorithms across sorting, searching, pathfinding, graphs, dynamic programming, strings, trees and backtracking — all in your browser.

---

## ✨ Features

- **Step-by-step playback** — play, pause, step forward/back, scrubbing speed slider
- **Synced C++ STL source code** with line highlighting as the visualization runs
- **3D Three.js hero scene** — interactive Quick Sort visualizer (drag to rotate, click bars to shuffle)
- **Big-O playground** — drag a slider to compare growth rates of O(1), O(log n), O(n), O(n log n), O(n²)
- **Live sort race** — four sorting algorithms compete on the same array, side-by-side
- **Algorithm spotlight** — auto-rotating hero tile featuring one algorithm at a time
- **Fancy animated 404** — pathfinding-style grid backdrop with glitch text
- **Fully responsive** — works on phones, tablets and large monitors
- **Custom inputs** — type arrays, draw walls on grids, pick from sample graphs
- **Complexity badges** — time and space complexity shown on every code panel

---

## 🧠 Algorithm catalog

### Sorting (13)
Bubble · Selection · Insertion · Merge · **Quick** · Heap · Shell · Counting · Radix · Cocktail · Gnome · Comb · Cycle

### Searching (6)
Linear · Binary · Jump · Interpolation · Exponential · Ternary

### Pathfinding (3) — on editable grids
BFS · **Dijkstra** · **A\***

### Graph algorithms (9)
DFS · BFS · Topological Sort · Cycle Detection · **Dijkstra** · **Bellman-Ford** · **Floyd-Warshall** · **Prim MST** · **Kruskal MST**

### Dynamic Programming (6)
Fibonacci · LCS · 0/1 Knapsack · Edit Distance · Coin Change · LIS

### String algorithms (4)
Naive · KMP · Rabin-Karp · Z-Algorithm

### Tree traversals (4)
Inorder · Preorder · Postorder · Level-order (BFS)

### Backtracking / Recursion
N-Queens · Knight's Tour (Warnsdorff) · Tower of Hanoi

---

## 🚀 Quick start

Requires **Node.js 20+** (Bun is also supported).

```bash
# 1. install dependencies (npm, pnpm, bun all work — pick one)
npm install

# 2. start the dev server
npm run dev

# 3. open the printed URL (usually http://localhost:5173)
```

### Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build (used by the platform) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

---

## 🛠 Tech stack

- **[TanStack Start](https://tanstack.com/start)** v1 — full-stack React framework with file-based routing
- **[TanStack Router](https://tanstack.com/router)** — type-safe client routing
- **[TanStack Query](https://tanstack.com/query)** — data fetching primitives
- **React 19** + **TypeScript** (strict)
- **Vite 7** — build tool
- **Tailwind CSS v4** (configured via `@import` in `src/styles.css`)
- **Framer Motion 12** — interactive animations
- **Three.js 0.176** — 3D Quick-Sort hero scene
- **Radix UI** + **shadcn/ui** — accessible component primitives
- **Lucide React** — icons

---

## 📁 Project structure

```
src/
├── routes/                      ← TanStack file-based routing
│   ├── __root.tsx               ← root layout, nav, fancy animated 404
│   ├── index.tsx                ← landing page (Three.js hero + interactive sections)
│   ├── sorting.tsx
│   ├── searching.tsx
│   ├── pathfinding.tsx
│   ├── graph.tsx
│   ├── dp.tsx
│   ├── strings.tsx
│   ├── tree.tsx
│   ├── nqueens.tsx
│   ├── knights.tsx
│   └── hanoi.tsx
├── components/
│   ├── Nav.tsx
│   ├── PythonCodePanel.tsx      ← C++ STL panel with line highlighting
│   ├── viz/Controls.tsx         ← play/pause/step/speed controls
│   └── ui/                      ← shadcn/ui primitives
├── lib/
│   ├── algorithms/              ← generator-based algorithm steppers
│   │   ├── sorting.ts
│   │   ├── searching.ts
│   │   ├── pathfinding.ts       ← BFS, Dijkstra, A*
│   │   ├── graph.ts             ← DFS, BFS, Topo, Cycle, Dijkstra,
│   │   │                          Bellman-Ford, Floyd-Warshall, Prim, Kruskal
│   │   ├── tree.ts
│   │   ├── dp.ts
│   │   ├── strings.ts
│   │   ├── backtracking.ts
│   │   ├── lineMaps.ts          ← runtime-step → highlighted source line
│   │   └── python.ts            ← C++ STL reference snippets (legacy filename)
│   └── usePlayer.ts             ← shared playback hook
├── styles.css                   ← design tokens + animations (Tailwind v4)
└── router.tsx
```

### How the visualizers work

Every algorithm is implemented as a TypeScript **generator** that yields a `Step` object describing the current state (which indices are being compared, which cell is being visited, the current path, …). A small `usePlayer` hook drives the generator at a configurable speed, exposing `play / pause / step / reset / index / total` to the route component. The page renders the current step with **Framer Motion**, and a `PythonCodePanel` highlights the matching C++ STL line via `lineMaps.ts`.

Adding a new algorithm is three steps:

1. Implement a `function* myAlgo(input): Generator<Step>` in the right file under `src/lib/algorithms/`.
2. Register it in the corresponding `*_ALGOS` map.
3. (Optional) Add a C++ snippet to `python.ts` and a step→line mapper to `lineMaps.ts`.

---

## 🎨 Design system

All colors, gradients and motion live in `src/styles.css` as semantic CSS custom properties (oklch). Components reference tokens via Tailwind utility classes — never hard-coded hex/named colors. The look is intentionally dark, glassy and editorial, with shimmery primary text and soft auroras behind the hero.

---

## 🌐 Routing

| Path | Page |
| --- | --- |
| `/` | Landing with Three.js hero + interactive sections |
| `/sorting` | 13 sorting algorithms |
| `/searching` | 6 searching algorithms |
| `/pathfinding` | BFS · Dijkstra · A\* on editable grid |
| `/graph` | 9 graph algorithms |
| `/dp` | Dynamic programming |
| `/strings` | String matching |
| `/tree` | Tree traversals |
| `/nqueens` | N-Queens backtracking |
| `/knights` | Knight's Tour (Warnsdorff) |
| `/hanoi` | Tower of Hanoi |
| `*` | Fancy animated 404 page |

---

## 🤝 Contributing

PRs are welcome. Please keep new algorithms in the generator-step format so they plug into the shared player and code-panel infrastructure.

## 📄 License

MIT
