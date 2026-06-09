import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlgoViz — Algorithm Visualizer" },
      { name: "description", content: "Watch sorting, searching, tree traversal, and pathfinding algorithms come to life." },
      { property: "og:title", content: "AlgoViz" },
      { property: "og:description", content: "Watch algorithms come to life with smooth animations." },
    ],
  }),
  component: Index,
});

const cards = [
  {
    to: "/sorting",
    title: "Sorting",
    desc: "Bubble, Selection, Insertion, Merge, Quick Sort",
    icon: "⟨⟩",
    accent: "oklch(0.72 0.19 255)",
    glow: "oklch(0.72 0.19 255 / 15%)",
    tag: "5 algorithms",
  },
  {
    to: "/searching",
    title: "Searching",
    desc: "Linear and Binary search on arrays",
    icon: "⌕",
    accent: "oklch(0.75 0.18 162)",
    glow: "oklch(0.75 0.18 162 / 15%)",
    tag: "2 algorithms",
  },
  {
    to: "/tree",
    title: "Tree Traversals",
    desc: "BFS, DFS — In / Pre / Post order",
    icon: "⋔",
    accent: "oklch(0.82 0.18 85)",
    glow: "oklch(0.82 0.18 85 / 15%)",
    tag: "4 algorithms",
  },
  {
    to: "/pathfinding",
    title: "Pathfinding",
    desc: "BFS, Dijkstra, and A* on editable grids",
    icon: "◈",
    accent: "oklch(0.68 0.22 22)",
    glow: "oklch(0.68 0.22 22 / 15%)",
    tag: "3 algorithms",
  },
  {
    to: "/graph",
    title: "Graph Algorithms",
    desc: "DFS, BFS, Topological Sort, Dijkstra, Prim MST",
    icon: "⬡",
    accent: "oklch(0.75 0.18 310)",
    glow: "oklch(0.75 0.18 310 / 15%)",
    tag: "6 algorithms",
  },
  {
    to: "/dp",
    title: "Dynamic Programming",
    desc: "Fibonacci, LCS, Knapsack, Edit Distance, Coin Change, LIS",
    icon: "⊞",
    accent: "oklch(0.72 0.22 180)",
    glow: "oklch(0.72 0.22 180 / 15%)",
    tag: "6 algorithms",
  },
  {
    to: "/strings",
    title: "String Algorithms",
    desc: "Naive, KMP, Rabin-Karp, Z-Algorithm, Boyer-Moore",
    icon: "Σ",
    accent: "oklch(0.82 0.22 60)",
    glow: "oklch(0.82 0.22 60 / 15%)",
    tag: "5 algorithms",
  },
] as const;

const stats = [
  { value: "64", label: "Algorithms" },
  { value: "7", label: "Categories" },
  { value: "60fps", label: "Animations" },
  { value: "∞", label: "Custom Data" },
];

function Index() {
  return (
    <div className="space-y-12 py-4 sm:py-8">
      {/* Hero */}
      <section className="text-center space-y-5 relative">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: "oklch(0.72 0.19 255)" }} />
          <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: "oklch(0.75 0.18 162)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "oklch(0.72 0.19 255 / 12%)", color: "oklch(0.72 0.19 255)", border: "1px solid oklch(0.72 0.19 255 / 25%)" }}>
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.72 0.19 255)" }} />
            Interactive Algorithm Learning
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          See algorithms{" "}
          <span className="shimmer-text">think</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mx-auto max-w-lg text-sm sm:text-base"
          style={{ color: "oklch(0.60 0.04 255)" }}
        >
          Step through classic algorithms in real-time. Adjust speed, load custom data, and understand how they work — one frame at a time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="flex justify-center gap-2 flex-wrap"
        >
          <Link
            to="/sorting"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)", boxShadow: "0 0 24px oklch(0.72 0.19 255 / 30%)" }}
          >
            Start Visualizing
            <span>→</span>
          </Link>
          <Link
            to="/pathfinding"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.85 0.01 255)", border: "1px solid oklch(1 0 0 / 10%)" }}
          >
            Try Pathfinding
          </Link>
        </motion.div>
      </section>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
        style={{ background: "oklch(1 0 0 / 6%)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center py-4 px-3" style={{ background: "oklch(0.10 0.02 265)" }}>
            <span className="text-2xl font-bold tracking-tight" style={{ color: "oklch(0.72 0.19 255)", letterSpacing: "-0.03em" }}>{s.value}</span>
            <span className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 255)" }}>{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Cards */}
      <section>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <Link
                to={c.to}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "oklch(0.12 0.025 265)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${c.glow}, 0 0 0 1px ${c.accent}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }} />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl" style={{ color: c.accent }}>{c.icon}</span>
                        <h2 className="text-base sm:text-lg font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>{c.title}</h2>
                      </div>
                      <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>{c.desc}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${c.accent}18`, color: c.accent }}>
                        {c.tag}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-all" style={{ color: c.accent }}>
                    Explore
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
