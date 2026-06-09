import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlgoViz — Algorithm Visualizer" },
      { name: "description", content: "Watch sorting, searching, tree traversal, and pathfinding algorithms come to life." },
      { property: "og:title", content: "AlgoViz" },
      { property: "og:description", content: "Watch algorithms come to life with smooth Framer Motion animations." },
    ],
  }),
  component: Index,
});

const cards = [
  { to: "/sorting", title: "Sorting", desc: "Bubble, Selection, Insertion, Merge, Quick.", color: "from-blue-500/15 to-blue-500/5" },
  { to: "/searching", title: "Searching", desc: "Linear and binary search on an array.", color: "from-emerald-500/15 to-emerald-500/5" },
  { to: "/tree", title: "Tree Traversals", desc: "BFS, DFS in / pre / post order.", color: "from-amber-500/15 to-amber-500/5" },
  { to: "/pathfinding", title: "Pathfinding", desc: "BFS, Dijkstra, and A* on a grid.", color: "from-rose-500/15 to-rose-500/5" },
] as const;

function Index() {
  return (
    <div className="space-y-10 py-8">
      <section className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight"
        >
          See algorithms <span className="text-primary">think</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mx-auto max-w-xl text-muted-foreground"
        >
          Interactive, animated visualizations of classic algorithms — step through them, adjust speed, and bring your own data.
        </motion.p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
          >
            <Link
              to={c.to}
              className={`block rounded-2xl border border-border bg-gradient-to-br ${c.color} p-6 hover:shadow-lg transition-shadow`}
            >
              <h2 className="text-xl font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Open →</span>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
