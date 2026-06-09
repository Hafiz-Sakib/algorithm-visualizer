import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "AlgoViz — Interactive Algorithm Visualizer with C++ Source" },
        { name: "description", content: "Visualize 40+ classic algorithms with step-by-step animations and synced C++ STL source code. Sorting, searching, graphs, DP and more." },
        { property: "og:title", content: "AlgoViz — Interactive Algorithm Visualizer" },
        { property: "og:description", content: "Watch algorithms come to life with smooth animations and line-by-line C++ source." },
      ],
    }),
    component: Index,
  }
);

// ─── Three.js animated scene ──────────────────────────────────────────────────
function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── 1. Floating node graph ────────────────────────────────────────────
    const nodeCount = 18;
    const nodeMeshes: THREE.Mesh[] = [];
    const nodePositions: THREE.Vector3[] = [];
    const nodeVelocities: THREE.Vector3[] = [];

    const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const colors = [
      new THREE.Color("oklch(0.72 0.19 255)"),
      new THREE.Color("oklch(0.75 0.18 162)"),
      new THREE.Color("oklch(0.82 0.18 85)"),
      new THREE.Color("oklch(0.68 0.22 22)"),
    ];

    for (let i = 0; i < nodeCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2
      );
      mesh.position.copy(pos);
      nodePositions.push(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.003
      );
      nodeVelocities.push(vel);
      nodeMeshes.push(mesh);
      scene.add(mesh);
    }

    // ── 2. Edges between nearby nodes ────────────────────────────────────
    const edgeLines: THREE.Line[] = [];
    const edgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("oklch(0.72 0.19 255)"),
      transparent: true,
      opacity: 0.18,
    });

    function rebuildEdges() {
      edgeLines.forEach((l) => scene.remove(l));
      edgeLines.length = 0;
      const threshold = 2.8;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          if (nodePositions[i].distanceTo(nodePositions[j]) < threshold) {
            const geo = new THREE.BufferGeometry().setFromPoints([
              nodePositions[i].clone(),
              nodePositions[j].clone(),
            ]);
            const line = new THREE.Line(geo, edgeMat);
            edgeLines.push(line);
            scene.add(line);
          }
        }
      }
    }
    rebuildEdges();

    // ── 3. Sorting bars in the back plane ────────────────────────────────
    const barCount = 12;
    const barHeights = Array.from({ length: barCount }, (_, i) =>
      0.3 + ((i * 7 + 3) % barCount) * 0.2
    );
    const barMeshes: THREE.Mesh[] = [];
    const barTargets: number[] = [...barHeights];

    for (let i = 0; i < barCount; i++) {
      const h = barHeights[i];
      const geo = new THREE.BoxGeometry(0.3, h, 0.15);
      const frac = i / (barCount - 1);
      const c = new THREE.Color();
      c.setHSL(0.58 + frac * 0.25, 0.8, 0.55);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.28 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-2.2 + i * 0.4, h / 2 - 1.8, -1.5);
      barMeshes.push(mesh);
      scene.add(mesh);
    }

    // ── 4. Pathfinding grid dots ──────────────────────────────────────────
    const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("oklch(0.75 0.18 162)"),
      transparent: true,
      opacity: 0.22,
    });
    for (let gx = -3; gx <= 3; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(gx * 0.7, gy * 0.7 - 0.3, -3);
        scene.add(dot);
      }
    }

    // ── Animation loop ────────────────────────────────────────────────────
    let frame = 0;
    let animId: number;
    let edgeRebuildCounter = 0;

    // Sort animation state
    let sortStep = 0;
    let sortTimer = 0;
    const sortedTargets = [...barTargets].sort((a, b) => a - b);
    let currentTargets = [...barTargets];
    let sortPhase = 0; // 0 = shuffle, 1 = sort

    function animate() {
      animId = requestAnimationFrame(animate);
      frame++;
      edgeRebuildCounter++;

      // Move nodes
      for (let i = 0; i < nodeCount; i++) {
        nodePositions[i].add(nodeVelocities[i]);
        // Bounce off soft bounding box
        if (Math.abs(nodePositions[i].x) > 4.2) nodeVelocities[i].x *= -1;
        if (Math.abs(nodePositions[i].y) > 2.2) nodeVelocities[i].y *= -1;
        if (Math.abs(nodePositions[i].z) > 1.2) nodeVelocities[i].z *= -1;
        nodeMeshes[i].position.copy(nodePositions[i]);
        // Pulse opacity
        const mat = nodeMeshes[i].material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + 0.35 * Math.sin(frame * 0.025 + i * 0.7);
      }

      // Rebuild edges every 8 frames
      if (edgeRebuildCounter >= 8) {
        rebuildEdges();
        edgeRebuildCounter = 0;
      }

      // Animate bars (bubble sort steps, then shuffle)
      sortTimer++;
      if (sortTimer > 60) {
        sortTimer = 0;
        if (sortPhase === 0) {
          // bubble sort one step
          let swapped = false;
          for (let i = 0; i < currentTargets.length - 1 - sortStep; i++) {
            if (currentTargets[i] > currentTargets[i + 1]) {
              [currentTargets[i], currentTargets[i + 1]] = [currentTargets[i + 1], currentTargets[i]];
              swapped = true;
              break;
            }
          }
          if (!swapped) {
            sortStep++;
            if (sortStep >= currentTargets.length) {
              sortPhase = 1;
              sortStep = 0;
              setTimeout(() => {
                // shuffle
                for (let i = currentTargets.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [currentTargets[i], currentTargets[j]] = [currentTargets[j], currentTargets[i]];
                }
                sortPhase = 0;
              }, 2000);
            }
          }
        }
        // lerp bars to targets
        for (let i = 0; i < barCount; i++) {
          const target = currentTargets[i];
          barMeshes[i].scale.y = THREE.MathUtils.lerp(barMeshes[i].scale.y, target / barHeights[i], 0.15);
          barMeshes[i].position.y =
            (barMeshes[i].scale.y * barHeights[i]) / 2 - 1.8;
        }
      }

      // Gentle camera float
      camera.position.x = Math.sin(frame * 0.004) * 0.4;
      camera.position.y = Math.cos(frame * 0.003) * 0.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    const onResize = () => {
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const cards = [
  { to: "/sorting",     title: "Sorting",             desc: "Bubble, Selection, Insertion, Merge, Quick, Heap and 7 more",  icon: "⟨⟩", accent: "oklch(0.72 0.19 255)", glow: "oklch(0.72 0.19 255 / 15%)", tag: "13 algorithms" },
  { to: "/searching",   title: "Searching",           desc: "Linear, Binary, Jump, Exponential, Ternary, Interpolation",      icon: "⌕", accent: "oklch(0.75 0.18 162)", glow: "oklch(0.75 0.18 162 / 15%)", tag: "6 algorithms" },
  { to: "/tree",        title: "Tree Traversals",     desc: "BFS, DFS — In / Pre / Post order",                                icon: "⋔", accent: "oklch(0.82 0.18 85)",  glow: "oklch(0.82 0.18 85 / 15%)",  tag: "4 algorithms" },
  { to: "/pathfinding", title: "Pathfinding",         desc: "BFS, Dijkstra, and A* on editable grids",                         icon: "◈", accent: "oklch(0.68 0.22 22)",  glow: "oklch(0.68 0.22 22 / 15%)",  tag: "3 algorithms" },
  { to: "/graph",       title: "Graph Algorithms",    desc: "DFS, BFS, Topological Sort, Dijkstra, Prim MST",                  icon: "⬡", accent: "oklch(0.75 0.18 310)", glow: "oklch(0.75 0.18 310 / 15%)", tag: "6 algorithms" },
  { to: "/dp",          title: "Dynamic Programming", desc: "Fibonacci, LCS, Knapsack, Edit Distance, Coin Change, LIS",       icon: "⊞", accent: "oklch(0.72 0.22 180)", glow: "oklch(0.72 0.22 180 / 15%)", tag: "6 algorithms" },
  { to: "/strings",     title: "String Algorithms",   desc: "Naive, KMP, Rabin-Karp, Z-Algorithm",                             icon: "Σ", accent: "oklch(0.82 0.22 60)",  glow: "oklch(0.82 0.22 60 / 15%)",  tag: "4 algorithms" },
  { to: "/nqueens",     title: "N-Queens",            desc: "Classic backtracking solver on an interactive board",             icon: "♛", accent: "oklch(0.82 0.18 85)",  glow: "oklch(0.82 0.18 85 / 15%)",  tag: "Backtracking" },
  { to: "/knights",     title: "Knight's Tour",       desc: "Warnsdorff's heuristic visits every chessboard square",            icon: "♞", accent: "oklch(0.72 0.22 180)", glow: "oklch(0.72 0.22 180 / 15%)", tag: "Chess" },
  { to: "/hanoi",       title: "Tower of Hanoi",      desc: "Recursive disk moves with an animated 3-peg solution",            icon: "⌬", accent: "oklch(0.75 0.18 310)", glow: "oklch(0.75 0.18 310 / 15%)", tag: "Recursion" },
] as const;

const stats = [
  { value: "45+",   label: "Algorithms" },
  { value: "10",    label: "Categories" },
  { value: "60fps", label: "Animations" },
  { value: "⌘",    label: "C++ Code" },
];

const features = [
  { icon: "▶",  title: "Step-by-step playback",     desc: "Play, pause, step forward or back. Adjust speed at any time to slow down the tricky parts." },
  { icon: "⌘", title: "Live C++ STL code",          desc: "Each visualization is paired with clean, well-commented C++ using STL you can read, copy, or download." },
  { icon: "✦",  title: "Synced line highlighting",  desc: "As the visualization runs, the matching line in the C++ source lights up so the algorithm makes sense." },
  { icon: "⌗",  title: "Custom inputs",             desc: "Type your own arrays, draw obstacles on pathfinding grids, and pick from sample graphs." },
  { icon: "⏱",  title: "Complexity badges",         desc: "Time and space complexity are shown next to every algorithm so trade-offs are obvious." },
  { icon: "📱", title: "Fully responsive",          desc: "Looks and feels great on phone, tablet, laptop, monitor — code panel adapts to your screen." },
];

const howSteps = [
  { n: "01", title: "Pick a category",   desc: "Choose Sorting, Searching, Graphs, DP and more from the sidebar." },
  { n: "02", title: "Pick an algorithm", desc: "Each category ships with multiple classic algorithms to compare side-by-side." },
  { n: "03", title: "Press play",        desc: "Watch it run. Step backwards, adjust speed, or jump frame-by-frame." },
  { n: "04", title: "Read the code",     desc: "The C++ panel highlights the line that is currently executing." },
];

const faqs = [
  { q: "Is this free?",                       a: "Yes — completely free and open in your browser. No sign-up required." },
  { q: "Can I use the C++ code in my own projects?", a: "Absolutely. Use the Copy or Download button on any code panel. The snippets use only the C++ standard template library." },
  { q: "Why C++ and not JavaScript?",      a: "C++ with STL is concise, fast, and what most CS courses and interviews use, which makes the algorithms easier to follow. The actual visualizer is built in TypeScript." },
  { q: "Does it work on mobile?",             a: "Yes. The layout stacks vertically on phones and tablets, and the visualization keeps its proportions." },
];

const testimonials = [
  { name: "Anika R.",   role: "CS Student",          quote: "The line highlighting finally made Dijkstra click for me. I stopped memorizing and started understanding." },
  { name: "Marcus T.",  role: "Self-taught dev",     quote: "I keep AlgoViz open in a tab during interview prep. Watching Quick Sort partition is oddly satisfying." },
  { name: "Priya S.",   role: "Bootcamp instructor", quote: "I use this in lectures. Students see the algorithm AND read the C++ at the same time — game changer." },
  { name: "David K.",   role: "Software Engineer",   quote: "Best free algorithm visualizer I've found. The DP table animations alone are worth bookmarking." },
];

const topics = [
  "Bubble Sort","Quick Sort","Merge Sort","Heap Sort","Radix Sort",
  "Binary Search","Jump Search","Interpolation Search",
  "BFS","DFS","Dijkstra","A*","Prim MST","Topological Sort",
  "KMP","Rabin-Karp","Z-Algorithm",
  "Fibonacci DP","Knapsack","LCS","Edit Distance","Coin Change","LIS",
  "Inorder","Preorder","Postorder","Level-order",
];

// ─── Motion variants ──────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show:   { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 18 } },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8 overflow-hidden">
      {/* ───────── Hero ───────── */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="text-center space-y-5 relative"
      >
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            animate={{ y: [0, 24, 0], x: [0, 14, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-25"
            style={{ background: "oklch(0.72 0.19 255)" }}
          />
          <motion.div
            animate={{ y: [0, -18, 0], x: [0, -22, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-1/4 w-56 h-56 rounded-full blur-3xl opacity-20"
            style={{ background: "oklch(0.75 0.18 162)" }}
          />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-10"
            style={{ background: "conic-gradient(from 0deg, oklch(0.72 0.19 255), oklch(0.75 0.18 162), oklch(0.82 0.18 85), oklch(0.72 0.19 255))" }}
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "oklch(0.72 0.19 255 / 12%)", color: "oklch(0.72 0.19 255)", border: "1px solid oklch(0.72 0.19 255 / 25%)" }}>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "oklch(0.72 0.19 255)" }}
            />
            Interactive Algorithm Learning · with live C++
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          See algorithms{" "}
          <span className="shimmer-text">think</span>.<br />
          <span className="text-2xl sm:text-3xl md:text-4xl" style={{ color: "oklch(0.65 0.04 255)" }}>
            Read the C++ <span style={{ color: "oklch(0.72 0.19 255)" }}>line-by-line</span>.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          className="mx-auto max-w-xl text-sm sm:text-base"
          style={{ color: "oklch(0.60 0.04 255)" }}
        >
          Step through 40+ classic algorithms in real-time. Every animation is paired with the matching C++ STL implementation —
          and the currently-executing line lights up as you watch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="flex justify-center gap-2 flex-wrap"
        >
          <Link to="/sorting"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)", boxShadow: "0 0 24px oklch(0.72 0.19 255 / 30%)" }}>
            Start Visualizing <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>→</motion.span>
          </Link>
          <Link to="/pathfinding"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.85 0.01 255)", border: "1px solid oklch(1 0 0 / 10%)" }}>
            Try Pathfinding
          </Link>
        </motion.div>

        {/* ── Three.js hero demo ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mx-auto mt-10 max-w-2xl rounded-2xl overflow-hidden relative"
          style={{
            background: "oklch(0.08 0.02 265)",
            border: "1px solid oklch(1 0 0 / 10%)",
            height: "260px",
          }}
        >
          {/* Corner glow accents */}
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
            style={{ background: "oklch(0.72 0.19 255)", transform: "translate(-30%, -30%)" }} />
          <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ background: "oklch(0.75 0.18 162)", transform: "translate(30%, 30%)" }} />

          <ThreeScene />

          {/* Label row */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-4 pointer-events-none">
            {[
              { dot: "oklch(0.72 0.19 255)", label: "Graph nodes" },
              { dot: "oklch(0.75 0.18 162)", label: "Grid paths" },
              { dot: "oklch(0.82 0.18 85)",  label: "Sort bars" },
            ].map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] font-mono"
                style={{ color: "oklch(0.50 0.04 255)" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* ───────── Stats bar ───────── */}
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
        style={{ background: "oklch(1 0 0 / 6%)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={popIn}
            whileHover={{ scale: 1.04 }}
            className="flex flex-col items-center py-4 px-3 cursor-default"
            style={{ background: "oklch(0.10 0.02 265)" }}
          >
            <span className="text-2xl font-bold tracking-tight" style={{ color: "oklch(0.72 0.19 255)", letterSpacing: "-0.03em" }}>{s.value}</span>
            <span className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 255)" }}>{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* ───────── Category cards ───────── */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Explore by category</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>Seven sections, dozens of algorithms — every one with a synced C++ panel.</p>
        </motion.header>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <motion.div
              key={c.to}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
            >
              <Link to={c.to}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300"
                style={{ background: "oklch(0.12 0.025 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${c.glow}, 0 0 0 1px ${c.accent}30`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }} />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <motion.span
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="text-xl"
                          style={{ color: c.accent }}
                        >{c.icon}</motion.span>
                        <h3 className="text-base sm:text-lg font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>{c.title}</h3>
                      </div>
                      <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>{c.desc}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${c.accent}18`, color: c.accent }}>{c.tag}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-medium" style={{ color: c.accent }}>
                    Explore <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ───────── Features ───────── */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>What you get</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>Designed to make algorithms click — not just watch them move.</p>
        </motion.header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ scale: 1.03 }}
              className="rounded-2xl p-5 cursor-default"
              style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 8 }}
                className="text-xl mb-2 inline-block"
                style={{ color: "oklch(0.72 0.19 255)" }}
              >{f.icon}</motion.div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">{f.title}</h3>
              <p className="text-xs sm:text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ───────── How it works ───────── */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>How it works</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>Four steps from curious to confident.</p>
        </motion.header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 relative">
          {howSteps.map((s, i) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "oklch(0.12 0.025 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 0.15, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring" }}
                className="absolute top-2 right-3 text-3xl font-bold"
                style={{ color: "oklch(0.72 0.19 255)" }}
              >{s.n}</motion.div>
              <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-xs" style={{ color: "oklch(0.55 0.04 255)" }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ───────── Topics marquee ───────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <header>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Everything covered</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>A peek at the algorithms waiting for you.</p>
        </header>
        <div
          className="relative overflow-hidden rounded-2xl py-5"
          style={{
            background: "oklch(0.10 0.02 265)",
            border: "1px solid oklch(1 0 0 / 8%)",
            maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <motion.div
            className="flex gap-2 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {[...topics, ...topics].map((t, i) => (
              <span
                key={i}
                className="inline-block px-3 py-1.5 rounded-full text-xs font-mono"
                style={{
                  background: "oklch(1 0 0 / 5%)",
                  color: "oklch(0.70 0.04 255)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                }}
              >
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ───────── Testimonials ───────── */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Loved by learners</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>Real notes from people who used it to study.</p>
        </motion.header>
        <div className="grid gap-3 sm:grid-cols-2">
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              whileHover={{ y: -3, boxShadow: "0 12px 30px oklch(0.72 0.19 255 / 12%)" }}
              className="rounded-2xl p-5 relative"
              style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
            >
              <span
                className="absolute top-3 right-4 text-5xl leading-none opacity-15 font-serif"
                style={{ color: "oklch(0.72 0.19 255)" }}
              >"</span>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.78 0.02 255)" }}>{t.quote}</p>
              <div className="mt-4 flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "oklch(0.72 0.19 255 / 18%)", color: "oklch(0.72 0.19 255)" }}
                >
                  {t.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div>
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[10px]" style={{ color: "oklch(0.50 0.04 255)" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ───────── Tech stack ───────── */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Built with</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>Modern tooling for a snappy experience.</p>
        </motion.header>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "TanStack Start", c: "oklch(0.72 0.19 255)" },
            { name: "React 19",       c: "oklch(0.75 0.18 162)" },
            { name: "TypeScript",     c: "oklch(0.72 0.19 255)" },
            { name: "Tailwind CSS",   c: "oklch(0.75 0.18 200)" },
            { name: "Framer Motion",  c: "oklch(0.82 0.18 85)"  },
            { name: "Three.js",       c: "oklch(0.82 0.22 60)"  },
            { name: "Vite",           c: "oklch(0.72 0.22 20)"  },
            { name: "C++ STL",        c: "oklch(0.72 0.22 180)" },
          ].map((tech) => (
            <motion.span
              key={tech.name}
              variants={popIn}
              whileHover={{ scale: 1.08, y: -2 }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-default"
              style={{
                background: `${tech.c}14`,
                color: tech.c,
                border: `1px solid ${tech.c}30`,
              }}
            >
              {tech.name}
            </motion.span>
          ))}
        </div>
      </motion.section>

      {/* ───────── FAQ ───────── */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Questions</h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>The short version.</p>
        </motion.header>
        <div className="grid gap-3 sm:grid-cols-2">
          {faqs.map((f) => (
            <motion.details
              key={f.q}
              variants={fadeUp}
              className="rounded-2xl p-4 group"
              style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
            >
              <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between list-none">
                {f.q}
                <span className="text-xs transition-transform group-open:rotate-90" style={{ color: "oklch(0.55 0.04 255)" }}>›</span>
              </summary>
              <p className="text-xs sm:text-sm mt-2" style={{ color: "oklch(0.60 0.04 255)" }}>{f.a}</p>
            </motion.details>
          ))}
        </div>
      </motion.section>

      {/* ───────── CTA ───────── */}
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.12 0.04 265) 0%, oklch(0.10 0.02 265) 100%)", border: "1px solid oklch(1 0 0 / 10%)" }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -z-10 opacity-25"
          style={{ background: "conic-gradient(from 0deg, transparent, oklch(0.72 0.19 255 / 40%), transparent 50%)" }}
        />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>Ready to see your first algorithm?</h2>
        <p className="text-sm mt-2 mx-auto max-w-md" style={{ color: "oklch(0.60 0.04 255)" }}>Bubble sort is a great place to start. Then graduate to graphs and DP when you're hooked.</p>
        <div className="mt-5 flex justify-center gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link to="/sorting" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)" }}>
              Open Sorting →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link to="/dp" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.85 0.01 255)", border: "1px solid oklch(1 0 0 / 10%)" }}>
              Or jump to DP
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ───────── Footer ───────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-xs pt-4 pb-2"
        style={{ color: "oklch(0.45 0.04 255)" }}
      >
        Built with TanStack Start, React, Three.js & a lot of{" "}
        <motion.span
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="inline-block"
          style={{ color: "oklch(0.72 0.19 255)" }}
        >♥</motion.span>{" "}
        for algorithms.
      </motion.footer>
    </div>
  );
}
