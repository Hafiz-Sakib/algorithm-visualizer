import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef, useEffect, useState } from "react";
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

// ─── Three.js interactive 3D sorting visualizer ──────────────────────────────
const HERO_ALGOS = ["Bubble", "Selection", "Insertion", "Quick"] as const;
type HeroAlgo = (typeof HERO_ALGOS)[number];

type SortStep =
  | { type: "compare"; i: number; j: number }
  | { type: "swap"; i: number; j: number }
  | { type: "sorted"; i: number };

function genSortSteps(algo: HeroAlgo, input: number[]): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [];
  const cmp = (i: number, j: number) => steps.push({ type: "compare", i, j });
  const swp = (i: number, j: number) => {
    [a[i], a[j]] = [a[j], a[i]];
    steps.push({ type: "swap", i, j });
  };

  if (algo === "Bubble") {
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        cmp(j, j + 1);
        if (a[j] > a[j + 1]) swp(j, j + 1);
      }
      steps.push({ type: "sorted", i: n - 1 - i });
    }
    steps.push({ type: "sorted", i: 0 });
  } else if (algo === "Selection") {
    for (let i = 0; i < n - 1; i++) {
      let mn = i;
      for (let j = i + 1; j < n; j++) {
        cmp(mn, j);
        if (a[j] < a[mn]) mn = j;
      }
      if (mn !== i) swp(i, mn);
      steps.push({ type: "sorted", i });
    }
    steps.push({ type: "sorted", i: n - 1 });
  } else if (algo === "Insertion") {
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        cmp(j - 1, j);
        if (a[j - 1] > a[j]) {
          swp(j - 1, j);
          j--;
        } else break;
      }
    }
    for (let i = 0; i < n; i++) steps.push({ type: "sorted", i });
  } else {
    // Quick (Lomuto)
    const qs = (lo: number, hi: number) => {
      if (lo >= hi) {
        if (lo === hi) steps.push({ type: "sorted", i: lo });
        return;
      }
      const pivot = a[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        cmp(j, hi);
        if (a[j] <= pivot) {
          i++;
          if (i !== j) swp(i, j);
        }
      }
      if (i + 1 !== hi) swp(i + 1, hi);
      steps.push({ type: "sorted", i: i + 1 });
      qs(lo, i);
      qs(i + 2, hi);
    };
    qs(0, n - 1);
  }
  return steps;
}

const BAR_COUNT = 16;

function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [algo, setAlgo] = useState<HeroAlgo>("Bubble");
  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 1;
    const H = el.clientHeight || 1;

    // ── Scene / camera / renderer ──────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color("#05060d"), 9, 18);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 1.4, 7.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Lights ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 6, 4);
    scene.add(key);
    const rim = new THREE.PointLight(new THREE.Color("#4da3ff"), 14, 22);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    const rim2 = new THREE.PointLight(new THREE.Color("#3ddc97"), 9, 20);
    rim2.position.set(5, -1, 3);
    scene.add(rim2);

    // ── World group (drag-rotates) ─────────────────────────────────────
    const world = new THREE.Group();
    scene.add(world);

    // Floor grid
    const grid = new THREE.GridHelper(14, 28, new THREE.Color("#27406b"), new THREE.Color("#141d33"));
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = -1.62;
    world.add(grid);

    // Particle backdrop
    const pCount = 220;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color("#7aa7ff"),
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    world.add(particles);

    // ── Sorting bars ───────────────────────────────────────────────────
    const SPACING = 0.46;
    const X0 = -((BAR_COUNT - 1) * SPACING) / 2;
    const xAt = (slot: number) => X0 + slot * SPACING;
    const hOf = (v: number) => 0.45 + v * 2.6; // v in (0,1]

    // values 1..BAR_COUNT shuffled
    const values = Array.from({ length: BAR_COUNT }, (_, i) => (i + 1) / BAR_COUNT);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    interface Bar {
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      value: number;
      slot: number; // current logical slot
      sorted: boolean;
    }

    const baseColor = (v: number) => {
      const c = new THREE.Color();
      c.setHSL(0.62 - v * 0.13, 0.75, 0.42 + v * 0.18); // deep blue → cyan
      return c;
    };
    const C_COMPARE = new THREE.Color("#ffd34d");
    const C_SWAP = new THREE.Color("#ff6b5e");
    const C_SORTED = new THREE.Color("#3ddc97");
    const C_HOVER = new THREE.Color("#ffffff");

    const bars: Bar[] = [];
    const slotToBar: Bar[] = [];
    const barGeo = new THREE.BoxGeometry(0.32, 1, 0.32);

    for (let i = 0; i < BAR_COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor(values[i]),
        emissive: baseColor(values[i]),
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.25,
      });
      const mesh = new THREE.Mesh(barGeo, mat);
      const h = hOf(values[i]);
      mesh.scale.y = h;
      mesh.position.set(xAt(i), h / 2 - 1.6, 0);
      world.add(mesh);
      const bar: Bar = { mesh, mat, value: values[i], slot: i, sorted: false };
      bars.push(bar);
      slotToBar[i] = bar;
    }

    // ── Sorting playback state ─────────────────────────────────────────
    let steps = genSortSteps(algo, values);
    let stepIdx = 0;
    let frame = 0;
    let framesPerStep = 6;
    let cooldown = 0; // pause frames between runs
    let comparing: [Bar, Bar] | null = null;

    interface SwapTween {
      a: Bar;
      b: Bar;
      t: number; // 0..1
      fromA: number;
      fromB: number;
    }
    const tweens: SwapTween[] = [];

    function reshuffle() {
      // shuffle the *bars'* values in place, reset visuals & steps
      const vals = bars.map((b) => b.value);
      for (let i = vals.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vals[i], vals[j]] = [vals[j], vals[i]];
      }
      bars.forEach((b, i) => {
        b.value = vals[i];
        b.sorted = false;
        b.slot = i;
        slotToBar[i] = b;
        const h = hOf(b.value);
        b.mesh.scale.y = h;
        b.mesh.position.set(xAt(i), h / 2 - 1.6, 0);
      });
      steps = genSortSteps(algo, vals);
      stepIdx = 0;
      comparing = null;
      tweens.length = 0;
      cooldown = 30;
    }

    function applyStep(s: SortStep) {
      if (s.type === "compare") {
        comparing = [slotToBar[s.i], slotToBar[s.j]];
      } else if (s.type === "swap") {
        const A = slotToBar[s.i];
        const B = slotToBar[s.j];
        tweens.push({ a: A, b: B, t: 0, fromA: xAt(A.slot), fromB: xAt(B.slot) });
        const tmp = A.slot;
        A.slot = B.slot;
        B.slot = tmp;
        slotToBar[A.slot] = A;
        slotToBar[B.slot] = B;
        comparing = null;
      } else {
        slotToBar[s.i].sorted = true;
        comparing = null;
      }
    }

    // ── Interaction: drag-orbit, hover, click-to-shuffle ───────────────
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-10, -10);
    let hovered: Bar | null = null;

    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let targetYaw = 0;
    let targetPitch = 0.06;

    const dom = renderer.domElement;
    dom.style.touchAction = "none";

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        targetYaw += dx * 0.006;
        targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.004, -0.15, 0.5);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragging && moved < 6) reshuffle(); // a click (not a drag) reshuffles
      dragging = false;
      try { dom.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onPointerLeave = () => {
      pointerNDC.set(-10, -10);
    };
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointerleave", onPointerLeave);

    // ── Animation loop ─────────────────────────────────────────────────
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      frame++;

      // Playback: advance algorithm steps
      if (cooldown > 0) {
        cooldown--;
      } else if (frame % framesPerStep === 0) {
        if (stepIdx < steps.length) {
          // speed up long tails (bubble sort gets chatty)
          framesPerStep = steps.length - stepIdx > 160 ? 3 : steps.length - stepIdx > 60 ? 4 : 6;
          applyStep(steps[stepIdx++]);
        } else if (steps.length > 0) {
          // run finished — admire the sorted state, then loop forever
          comparing = null;
          cooldown = 130;
          steps = [];
          stepIdx = 0;
        } else {
          reshuffle();
        }
      }

      // Swap tweens — bars arc over each other while trading places
      for (let k = tweens.length - 1; k >= 0; k--) {
        const tw = tweens[k];
        tw.t = Math.min(1, tw.t + 0.08);
        const e = 0.5 - 0.5 * Math.cos(Math.PI * tw.t); // ease in-out
        const lift = Math.sin(Math.PI * tw.t) * 0.55;
        tw.a.mesh.position.x = THREE.MathUtils.lerp(tw.fromA, xAt(tw.a.slot), e);
        tw.b.mesh.position.x = THREE.MathUtils.lerp(tw.fromB, xAt(tw.b.slot), e);
        tw.a.mesh.position.z = lift;
        tw.b.mesh.position.z = -lift;
        if (tw.t >= 1) {
          tw.a.mesh.position.z = 0;
          tw.b.mesh.position.z = 0;
          tweens.splice(k, 1);
        }
      }

      // Hover raycast
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(bars.map((b) => b.mesh), false);
      hovered = hits.length ? bars.find((b) => b.mesh === hits[0].object) ?? null : null;

      // Bar colors / glow
      for (const b of bars) {
        const inTween = tweens.some((tw) => tw.a === b || tw.b === b);
        const isCmp = comparing !== null && (comparing[0] === b || comparing[1] === b);
        let target: THREE.Color;
        let glow = 0.18;
        if (b === hovered) {
          target = C_HOVER; glow = 0.5;
        } else if (inTween) {
          target = C_SWAP; glow = 0.9;
        } else if (isCmp) {
          target = C_COMPARE; glow = 0.8;
        } else if (b.sorted) {
          target = C_SORTED; glow = 0.35;
        } else {
          target = baseColor(b.value);
        }
        b.mat.color.lerp(target, 0.25);
        b.mat.emissive.lerp(target, 0.25);
        b.mat.emissiveIntensity += (glow - b.mat.emissiveIntensity) * 0.2;
        // subtle hover pop
        const hs = hOf(b.value) * (b === hovered ? 1.04 : 1);
        b.mesh.scale.y += (hs - b.mesh.scale.y) * 0.25;
        b.mesh.position.y = b.mesh.scale.y / 2 - 1.6;
      }

      // Particles drift
      particles.rotation.y = frame * 0.0006;

      // World rotation: drag target + gentle idle drift + pointer parallax
      const idle = dragging ? 0 : Math.sin(frame * 0.0035) * 0.07;
      world.rotation.y += (targetYaw + idle - world.rotation.y) * 0.07;
      world.rotation.x += (targetPitch - world.rotation.x) * 0.07;

      camera.position.x += (pointerNDC.x === -10 ? 0 : pointerNDC.x * 0.35 - camera.position.x) * 0.03;
      camera.lookAt(0, -0.1, 0);

      renderer.render(scene, camera);
    }
    animate();

    // ── Resize / cleanup ───────────────────────────────────────────────
    const onResize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointerleave", onPointerLeave);
      barGeo.dispose();
      pGeo.dispose();
      pMat.dispose();
      bars.forEach((b) => b.mat.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
    };
  }, [algo, shuffleKey]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{ cursor: "grab" }}
      />
      {/* Algorithm picker */}
      <div className="absolute top-3 left-0 right-0 flex flex-wrap justify-center gap-1.5 z-10 px-3">
        {HERO_ALGOS.map((a) => (
          <button
            key={a}
            onClick={() => setAlgo(a)}
            className="px-2.5 py-1 rounded-full text-[11px] font-mono transition-all hover:scale-105"
            style={{
              background: a === algo ? "oklch(0.72 0.19 255 / 20%)" : "oklch(1 0 0 / 5%)",
              color: a === algo ? "oklch(0.78 0.15 255)" : "oklch(0.55 0.04 255)",
              border: `1px solid ${a === algo ? "oklch(0.72 0.19 255 / 45%)" : "oklch(1 0 0 / 10%)"}`,
            }}
          >
            {a}
          </button>
        ))}
        <button
          onClick={() => setShuffleKey((k) => k + 1)}
          className="px-2.5 py-1 rounded-full text-[11px] font-mono transition-all hover:scale-105"
          style={{
            background: "oklch(0.75 0.18 162 / 14%)",
            color: "oklch(0.75 0.18 162)",
            border: "1px solid oklch(0.75 0.18 162 / 35%)",
          }}
          title="Shuffle the bars"
        >
          ⤨ Shuffle
        </button>
      </div>
      {/* Hint */}
      <div
        className="absolute top-12 left-0 right-0 text-center text-[10px] font-mono pointer-events-none z-10"
        style={{ color: "oklch(0.45 0.04 255)" }}
      >
        drag to rotate · click bars to shuffle
      </div>
    </div>
  );
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
          className="mx-auto mt-10 max-w-3xl rounded-2xl overflow-hidden relative"
          style={{
            background: "oklch(0.08 0.02 265)",
            border: "1px solid oklch(1 0 0 / 10%)",
            height: "340px",
          }}
        >
          {/* Corner glow accents */}
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
            style={{ background: "oklch(0.72 0.19 255)", transform: "translate(-30%, -30%)" }} />
          <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ background: "oklch(0.75 0.18 162)", transform: "translate(30%, 30%)" }} />

          <ThreeScene />

          {/* Legend row */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-4 pointer-events-none">
            {[
              { dot: "#ffd34d", label: "Comparing" },
              { dot: "#ff6b5e", label: "Swapping" },
              { dot: "#3ddc97", label: "Sorted" },
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
