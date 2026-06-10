import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlgoViz — Interactive Algorithm Visualizer with C++ Source" },
      {
        name: "description",
        content:
          "Visualize 60+ classic algorithms with smooth animations and synced C++ STL source code — sorting, searching, graphs, DP, pathfinding and more.",
      },
      { property: "og:title", content: "AlgoViz — Interactive Algorithm Visualizer" },
      {
        property: "og:description",
        content:
          "Watch algorithms come to life with smooth animations and line-by-line C++ source.",
      },
    ],
  }),
  component: Index,
});

// ─── Three.js: Quick Sort + Binary Search animations ─────────────────────────
type HeroMode = "Quick Sort" | "Binary Search";
type SortStep =
  | { type: "compare"; i: number; j: number }
  | { type: "swap"; i: number; j: number }
  | { type: "sorted"; i: number };

type SearchStep =
  | { type: "range"; lo: number; hi: number }
  | { type: "probe"; mid: number }
  | { type: "found"; mid: number }
  | { type: "miss" };

function genQuickSteps(input: number[]): SortStep[] {
  const a = [...input];
  const steps: SortStep[] = [];
  const cmp = (i: number, j: number) => steps.push({ type: "compare", i, j });
  const swp = (i: number, j: number) => {
    [a[i], a[j]] = [a[j], a[i]];
    steps.push({ type: "swap", i, j });
  };
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
  qs(0, a.length - 1);
  return steps;
}

function genBinarySearchSteps(sorted: number[], target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let lo = 0,
    hi = sorted.length - 1;
  steps.push({ type: "range", lo, hi });
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    steps.push({ type: "probe", mid });
    if (sorted[mid] === target) {
      steps.push({ type: "found", mid });
      return steps;
    }
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
    steps.push({ type: "range", lo, hi });
  }
  steps.push({ type: "miss" });
  return steps;
}

const BAR_COUNT = 16;

function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<HeroMode>("Quick Sort");
  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 1;
    const H = el.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color("#05060d"), 9, 18);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 1.4, 7.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

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

    const world = new THREE.Group();
    scene.add(world);

    const grid = new THREE.GridHelper(
      14,
      28,
      new THREE.Color("#27406b"),
      new THREE.Color("#141d33"),
    );
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

    // ── Bars ──
    const SPACING = 0.46;
    const X0 = -((BAR_COUNT - 1) * SPACING) / 2;
    const xAt = (slot: number) => X0 + slot * SPACING;
    const hOf = (v: number) => 0.45 + v * 2.6;

    const initialValues = Array.from({ length: BAR_COUNT }, (_, i) => (i + 1) / BAR_COUNT);
    if (mode === "Quick Sort") {
      // shuffle for sort
      for (let i = initialValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialValues[i], initialValues[j]] = [initialValues[j], initialValues[i]];
      }
    }
    // Binary Search keeps the array sorted ascending

    interface Bar {
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      value: number;
      slot: number;
      sorted: boolean;
    }
    const baseColor = (v: number) => {
      const c = new THREE.Color();
      c.setHSL(0.62 - v * 0.13, 0.75, 0.42 + v * 0.18);
      return c;
    };
    const C_COMPARE = new THREE.Color("#ffd34d");
    const C_SWAP = new THREE.Color("#ff6b5e");
    const C_SORTED = new THREE.Color("#3ddc97");
    const C_HOVER = new THREE.Color("#ffffff");
    const C_RANGE = new THREE.Color("#5a7cff");
    const C_PROBE = new THREE.Color("#ffd34d");
    const C_FOUND = new THREE.Color("#3ddc97");
    const C_DIM = new THREE.Color("#2a3550");

    const bars: Bar[] = [];
    const slotToBar: Bar[] = [];
    const barGeo = new THREE.BoxGeometry(0.32, 1, 0.32);

    for (let i = 0; i < BAR_COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor(initialValues[i]),
        emissive: baseColor(initialValues[i]),
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.25,
      });
      const mesh = new THREE.Mesh(barGeo, mat);
      const h = hOf(initialValues[i]);
      mesh.scale.y = h;
      mesh.position.set(xAt(i), h / 2 - 1.6, 0);
      world.add(mesh);
      const bar: Bar = { mesh, mat, value: initialValues[i], slot: i, sorted: false };
      bars.push(bar);
      slotToBar[i] = bar;
    }

    // ── Playback state ──
    let sortSteps: SortStep[] = [];
    let searchSteps: SearchStep[] = [];
    let stepIdx = 0;
    let frame = 0;
    let framesPerStep = 18; // SLOWER default
    let cooldown = 0;
    let comparing: [Bar, Bar] | null = null;
    // search state
    let searchLo = 0,
      searchHi = BAR_COUNT - 1;
    let searchProbe = -1;
    let searchFound = -1;
    let searchTargetValue = 0;

    interface SwapTween {
      a: Bar;
      b: Bar;
      t: number;
      fromA: number;
      fromB: number;
    }
    const tweens: SwapTween[] = [];

    function rebuild() {
      const vals = bars.map((b) => b.value);
      if (mode === "Quick Sort") {
        for (let i = vals.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [vals[i], vals[j]] = [vals[j], vals[i]];
        }
      } else {
        vals.sort((a, b) => a - b);
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
      tweens.length = 0;
      comparing = null;
      stepIdx = 0;
      cooldown = 40;
      if (mode === "Quick Sort") {
        sortSteps = genQuickSteps(vals);
        searchSteps = [];
      } else {
        // pick a random element to find
        const idx = Math.floor(Math.random() * vals.length);
        searchTargetValue = vals[idx];
        searchSteps = genBinarySearchSteps(vals, searchTargetValue);
        sortSteps = [];
        searchLo = 0;
        searchHi = BAR_COUNT - 1;
        searchProbe = -1;
        searchFound = -1;
      }
    }
    rebuild();

    function applySortStep(s: SortStep) {
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
    function applySearchStep(s: SearchStep) {
      if (s.type === "range") {
        searchLo = s.lo;
        searchHi = s.hi;
        searchProbe = -1;
      } else if (s.type === "probe") {
        searchProbe = s.mid;
      } else if (s.type === "found") {
        searchFound = s.mid;
        searchProbe = s.mid;
      } else {
        searchProbe = -1;
      }
    }

    // ── Interaction ──
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-10, -10);
    let hovered: Bar | null = null;

    let dragging = false,
      moved = 0,
      lastX = 0,
      lastY = 0;
    let targetYaw = 0,
      targetPitch = 0.06;
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
        const dx = e.clientX - lastX,
          dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        targetYaw += dx * 0.006;
        targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.004, -0.15, 0.5);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragging && moved < 6) rebuild();
      dragging = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onPointerLeave = () => {
      pointerNDC.set(-10, -10);
    };
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointerleave", onPointerLeave);

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      frame++;

      if (cooldown > 0) {
        cooldown--;
      } else if (frame % framesPerStep === 0) {
        if (mode === "Quick Sort") {
          if (stepIdx < sortSteps.length) {
            framesPerStep = sortSteps.length - stepIdx > 40 ? 14 : 22;
            applySortStep(sortSteps[stepIdx++]);
          } else if (sortSteps.length > 0) {
            comparing = null;
            cooldown = 180;
            sortSteps = [];
            stepIdx = 0;
          } else {
            rebuild();
          }
        } else {
          if (stepIdx < searchSteps.length) {
            framesPerStep = 26; // slow & cinematic
            applySearchStep(searchSteps[stepIdx++]);
          } else if (searchSteps.length > 0) {
            cooldown = 180;
            searchSteps = [];
            stepIdx = 0;
          } else {
            rebuild();
          }
        }
      }

      // tweens
      for (let k = tweens.length - 1; k >= 0; k--) {
        const tw = tweens[k];
        tw.t = Math.min(1, tw.t + 0.045); // slower
        const e = 0.5 - 0.5 * Math.cos(Math.PI * tw.t);
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

      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(
        bars.map((b) => b.mesh),
        false,
      );
      hovered = hits.length ? (bars.find((b) => b.mesh === hits[0].object) ?? null) : null;

      for (const b of bars) {
        let target: THREE.Color;
        let glow = 0.18;
        if (mode === "Quick Sort") {
          const inTween = tweens.some((tw) => tw.a === b || tw.b === b);
          const isCmp = comparing !== null && (comparing[0] === b || comparing[1] === b);
          if (b === hovered) {
            target = C_HOVER;
            glow = 0.5;
          } else if (inTween) {
            target = C_SWAP;
            glow = 0.9;
          } else if (isCmp) {
            target = C_COMPARE;
            glow = 0.8;
          } else if (b.sorted) {
            target = C_SORTED;
            glow = 0.35;
          } else {
            target = baseColor(b.value);
          }
        } else {
          // Binary Search highlighting based on slot index
          const slot = b.slot;
          const inRange = slot >= searchLo && slot <= searchHi;
          const isProbe = slot === searchProbe;
          const isFound = slot === searchFound;
          if (isFound) {
            target = C_FOUND;
            glow = 1.1;
          } else if (isProbe) {
            target = C_PROBE;
            glow = 1.0;
          } else if (b === hovered) {
            target = C_HOVER;
            glow = 0.6;
          } else if (inRange) {
            target = C_RANGE;
            glow = 0.45;
          } else {
            target = C_DIM;
            glow = 0.05;
          }
        }
        b.mat.color.lerp(target, 0.22);
        b.mat.emissive.lerp(target, 0.22);
        b.mat.emissiveIntensity += (glow - b.mat.emissiveIntensity) * 0.18;
        const hs =
          hOf(b.value) *
          (b === hovered ? 1.04 : 1) *
          (mode === "Binary Search" && b.slot === searchProbe ? 1.12 : 1);
        b.mesh.scale.y += (hs - b.mesh.scale.y) * 0.22;
        b.mesh.position.y = b.mesh.scale.y / 2 - 1.6;
      }

      particles.rotation.y = frame * 0.0006;

      const idle = dragging ? 0 : Math.sin(frame * 0.0035) * 0.07;
      world.rotation.y += (targetYaw + idle - world.rotation.y) * 0.07;
      world.rotation.x += (targetPitch - world.rotation.x) * 0.07;
      camera.position.x +=
        (pointerNDC.x === -10 ? 0 : pointerNDC.x * 0.35 - camera.position.x) * 0.03;
      camera.lookAt(0, -0.1, 0);

      renderer.render(scene, camera);
    }
    animate();

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
  }, [mode, shuffleKey]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="absolute inset-0" style={{ cursor: "grab" }} />
      {/* Mode picker */}
      <div className="absolute top-3 left-0 right-0 flex flex-wrap justify-center gap-1.5 z-10 px-3">
        {(["Quick Sort", "Binary Search"] as HeroMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1 rounded-full text-[11px] font-mono transition-all hover:scale-105"
            style={{
              background: m === mode ? "oklch(0.72 0.19 255 / 22%)" : "oklch(1 0 0 / 5%)",
              color: m === mode ? "oklch(0.85 0.15 255)" : "oklch(0.55 0.04 255)",
              border: `1px solid ${m === mode ? "oklch(0.72 0.19 255 / 50%)" : "oklch(1 0 0 / 10%)"}`,
            }}
          >
            {m}
          </button>
        ))}
        <button
          onClick={() => setShuffleKey((k) => k + 1)}
          className="px-3 py-1 rounded-full text-[11px] font-mono transition-all hover:scale-105"
          style={{
            background: "oklch(0.75 0.18 162 / 14%)",
            color: "oklch(0.75 0.18 162)",
            border: "1px solid oklch(0.75 0.18 162 / 35%)",
          }}
        >
          ⤨ Restart
        </button>
      </div>
      <div
        className="absolute top-12 left-0 right-0 text-center text-[10px] font-mono pointer-events-none z-10"
        style={{ color: "oklch(0.45 0.04 255)" }}
      >
        drag to rotate · click to restart
      </div>
    </div>
  );
}

// ─── Big-O Playground (zoom by wheel, hover tooltips) ────────────────────────
type Complexity = { name: string; color: string; fn: (n: number) => number };
const COMPLEXITIES: Complexity[] = [
  { name: "O(1)", color: "oklch(0.75 0.18 162)", fn: () => 1 },
  { name: "O(log n)", color: "oklch(0.72 0.19 255)", fn: (n) => Math.log2(Math.max(1, n)) },
  { name: "O(n)", color: "oklch(0.82 0.18 85)", fn: (n) => n },
  { name: "O(n log n)", color: "oklch(0.75 0.18 310)", fn: (n) => n * Math.log2(Math.max(1, n)) },
  { name: "O(n²)", color: "oklch(0.68 0.22 22)", fn: (n) => n * n },
];

function BigOPlayground() {
  const [nMax, setNMax] = useState(60); // controls X range
  const [hover, setHover] = useState<{ x: number; y: number; n: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = 720,
    H = 280,
    PAD = 36;

  // wheel zoom — change nMax between 8..400
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setNMax((cur) => {
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      return Math.round(Math.min(400, Math.max(8, cur * factor)));
    });
  };

  // sample points
  const series = useMemo(() => {
    const N = 64;
    const xs = Array.from({ length: N }, (_, i) => (i / (N - 1)) * nMax);
    return COMPLEXITIES.map((c) => {
      const ys = xs.map(c.fn);
      const maxY = Math.max(...ys, 1);
      return { ...c, xs, ys, maxY };
    });
  }, [nMax]);

  // shared Y normalizer (log compressed so curves are comparable)
  const globalMax = Math.max(...series.flatMap((s) => s.maxY));
  const norm = (y: number) => Math.log1p(y) / Math.log1p(globalMax);

  const pxX = (n: number) => PAD + (n / nMax) * (W - 2 * PAD);
  const pxY = (y: number) => H - PAD - norm(y) * (H - 2 * PAD);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const n = Math.max(0, Math.min(nMax, ((xPx - PAD) / (W - 2 * PAD)) * nMax));
    setHover({ x: xPx, y: e.clientY - rect.top, n });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Big-O Playground
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Scroll on the chart to zoom · hover for exact values.
          </p>
        </div>
        <div
          className="text-xs font-mono px-3 py-1.5 rounded-full"
          style={{
            background: "oklch(1 0 0 / 5%)",
            border: "1px solid oklch(1 0 0 / 10%)",
            color: "oklch(0.7 0.04 255)",
          }}
        >
          n max ={" "}
          <span className="font-bold" style={{ color: "oklch(0.85 0.15 255)" }}>
            {nMax}
          </span>
        </div>
      </header>
      <div
        ref={wrapRef}
        onWheel={onWheel}
        className="relative rounded-2xl p-3 overflow-hidden"
        style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHover(null)}
          className="select-none cursor-crosshair"
        >
          {/* grid */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = PAD + ((H - 2 * PAD) * i) / 4;
            return (
              <line
                key={`gy${i}`}
                x1={PAD}
                x2={W - PAD}
                y1={y}
                y2={y}
                stroke="oklch(1 0 0 / 6%)"
                strokeDasharray="3 3"
              />
            );
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const x = PAD + ((W - 2 * PAD) * i) / 5;
            return (
              <line
                key={`gx${i}`}
                x1={x}
                x2={x}
                y1={PAD}
                y2={H - PAD}
                stroke="oklch(1 0 0 / 6%)"
                strokeDasharray="3 3"
              />
            );
          })}
          {/* axes labels */}
          <text
            x={PAD}
            y={H - 10}
            fill="oklch(0.5 0.04 255)"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            0
          </text>
          <text
            x={W - PAD - 22}
            y={H - 10}
            fill="oklch(0.5 0.04 255)"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            {nMax}
          </text>
          <text
            x={6}
            y={PAD + 4}
            fill="oklch(0.5 0.04 255)"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            ops
          </text>
          <text
            x={W - 14}
            y={H - 22}
            fill="oklch(0.5 0.04 255)"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            n
          </text>
          {/* curves */}
          {series.map((s) => {
            const d = s.xs
              .map(
                (x, i) => `${i === 0 ? "M" : "L"}${pxX(x).toFixed(1)},${pxY(s.ys[i]).toFixed(1)}`,
              )
              .join(" ");
            return (
              <path
                key={s.name}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                style={{ filter: `drop-shadow(0 0 6px ${s.color})` }}
              />
            );
          })}
          {/* hover crosshair */}
          {hover && (
            <>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={PAD}
                y2={H - PAD}
                stroke="oklch(1 0 0 / 25%)"
                strokeDasharray="2 2"
              />
              {series.map((s) => {
                const y = s.fn(hover.n);
                return (
                  <circle
                    key={s.name}
                    cx={hover.x}
                    cy={pxY(y)}
                    r="3.5"
                    fill={s.color}
                    stroke="white"
                    strokeWidth="0.8"
                  />
                );
              })}
            </>
          )}
        </svg>
        {/* tooltip */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none rounded-xl p-2.5 text-[11px] font-mono"
              style={{
                left: Math.min(hover.x + 12, (wrapRef.current?.clientWidth ?? W) - 180),
                top: Math.max(8, hover.y - 8),
                background: "oklch(0.06 0.02 265 / 95%)",
                border: "1px solid oklch(1 0 0 / 12%)",
                minWidth: 150,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <div className="mb-1.5" style={{ color: "oklch(0.7 0.04 255)" }}>
                n ≈{" "}
                <span className="font-bold" style={{ color: "oklch(0.85 0.15 255)" }}>
                  {hover.n.toFixed(1)}
                </span>
              </div>
              {series.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <span style={{ color: s.color }}>{s.name}</span>
                  <span style={{ color: "oklch(0.85 0.01 255)" }}>
                    {(() => {
                      const v = s.fn(hover.n);
                      return v >= 10000 ? v.toExponential(1) : v.toFixed(2);
                    })()}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {/* legend */}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {COMPLEXITIES.map((c) => (
            <span
              key={c.name}
              className="flex items-center gap-1.5 text-[11px] font-mono"
              style={{ color: "oklch(0.7 0.04 255)" }}
            >
              <span className="w-2.5 h-0.5 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── 5 new animated sections: Race, Spotlight, Complexity Table, Pseudocode Stepper, Timeline ─

// 1) Live Sort Race
function SortRace() {
  const algos = ["Bubble", "Insertion", "Selection", "Quick"] as const;
  const [tick, setTick] = useState(0);
  const data = useMemo(() => {
    const N = 22;
    const seed = Array.from({ length: N }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const runs: Record<string, number[]> = {};
    const counts: Record<string, number> = {};
    runs.Bubble = (() => {
      const a = [...seed];
      let c = 0;
      for (let i = 0; i < a.length; i++)
        for (let j = 0; j < a.length - 1 - i; j++) {
          c++;
          if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
        }
      counts.Bubble = c;
      return a;
    })();
    runs.Insertion = (() => {
      const a = [...seed];
      let c = 0;
      for (let i = 1; i < a.length; i++) {
        let j = i;
        while (j > 0) {
          c++;
          if (a[j - 1] > a[j]) {
            [a[j], a[j - 1]] = [a[j - 1], a[j]];
            j--;
          } else break;
        }
      }
      counts.Insertion = c;
      return a;
    })();
    runs.Selection = (() => {
      const a = [...seed];
      let c = 0;
      for (let i = 0; i < a.length; i++) {
        let m = i;
        for (let j = i + 1; j < a.length; j++) {
          c++;
          if (a[j] < a[m]) m = j;
        }
        [a[i], a[m]] = [a[m], a[i]];
      }
      counts.Selection = c;
      return a;
    })();
    runs.Quick = (() => {
      const a = [...seed];
      let c = 0;
      const qs = (lo: number, hi: number) => {
        if (lo >= hi) return;
        const p = a[hi];
        let i = lo - 1;
        for (let j = lo; j < hi; j++) {
          c++;
          if (a[j] <= p) {
            i++;
            [a[i], a[j]] = [a[j], a[i]];
          }
        }
        [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
        qs(lo, i);
        qs(i + 2, hi);
      };
      qs(0, a.length - 1);
      counts.Quick = c;
      return a;
    })();
    return { counts };
  }, [tick]);
  const maxC = Math.max(...Object.values(data.counts));
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="space-y-4"
    >
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Live Sort Race
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Comparisons performed on the same random array.
          </p>
        </div>
        <button
          onClick={() => setTick((t) => t + 1)}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
          style={{
            background: "oklch(0.75 0.18 162 / 18%)",
            color: "oklch(0.75 0.18 162)",
            border: "1px solid oklch(0.75 0.18 162 / 35%)",
          }}
        >
          ⟳ New race
        </button>
      </header>
      <div className="grid sm:grid-cols-2 gap-3">
        {algos.map((a) => (
          <div
            key={a}
            className="rounded-2xl p-4"
            style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
          >
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-mono font-semibold">{a}</span>
              <span className="font-mono" style={{ color: "oklch(0.55 0.04 255)" }}>
                {data.counts[a]} ops
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: "oklch(1 0 0 / 8%)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.counts[a] / maxC) * 100}%` }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{
                  background: a === "Quick" ? "oklch(0.75 0.18 162)" : "oklch(0.72 0.19 255)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// 2) Algorithm Spotlight (auto-rotating)
const spotlight = [
  {
    name: "Dijkstra",
    color: "oklch(0.75 0.18 310)",
    use: "Shortest path on positively-weighted graphs · GPS, routers",
  },
  {
    name: "A* Search",
    color: "oklch(0.82 0.18 85)",
    use: "Heuristic shortest path · pathfinding in games",
  },
  {
    name: "Quick Sort",
    color: "oklch(0.72 0.19 255)",
    use: "Divide-and-conquer · in-place general-purpose sort",
  },
  { name: "Binary Search", color: "oklch(0.75 0.18 162)", use: "O(log n) lookup in sorted arrays" },
  {
    name: "Bellman-Ford",
    color: "oklch(0.68 0.22 22)",
    use: "Shortest path · handles negative edges, detects cycles",
  },
  {
    name: "Floyd-Warshall",
    color: "oklch(0.72 0.22 180)",
    use: "All-pairs shortest paths via DP · O(n³)",
  },
  {
    name: "Kruskal MST",
    color: "oklch(0.82 0.22 60)",
    use: "Minimum spanning tree using union-find",
  },
];
function Spotlight() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % spotlight.length), 3200);
    return () => clearInterval(id);
  }, []);
  const item = spotlight[i];
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="space-y-4"
    >
      <header>
        <h2
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.025em" }}
        >
          Algorithm Spotlight
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
          Auto-rotating — one classic algorithm at a time.
        </p>
      </header>
      <div
        className="rounded-2xl p-6 relative overflow-hidden h-44 flex items-center"
        style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-25"
          style={{ background: item.color }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="font-mono text-xs mb-1" style={{ color: item.color }}>
              SPOTLIGHT · {String(i + 1).padStart(2, "0")}/{spotlight.length}
            </div>
            <h3 className="text-2xl font-bold tracking-tight">{item.name}</h3>
            <p className="text-sm mt-1" style={{ color: "oklch(0.7 0.04 255)" }}>
              {item.use}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {spotlight.map((_, k) => (
            <span
              key={k}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                background: k === i ? item.color : "oklch(1 0 0 / 15%)",
                width: k === i ? 16 : 6,
              }}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// 3) Complexity comparison table (animated rows)
const COMPLEXITY_TABLE = [
  { name: "Bubble Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  { name: "Quick Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  { name: "Merge Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  { name: "Heap Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
  { name: "Binary Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" },
  { name: "BFS / DFS", best: "O(V+E)", avg: "O(V+E)", worst: "O(V+E)", space: "O(V)" },
  { name: "Dijkstra", best: "O(E log V)", avg: "O(E log V)", worst: "O(E log V)", space: "O(V)" },
  { name: "Bellman-Ford", best: "O(VE)", avg: "O(VE)", worst: "O(VE)", space: "O(V)" },
  { name: "Floyd-Warshall", best: "O(V³)", avg: "O(V³)", worst: "O(V³)", space: "O(V²)" },
];
function ComplexityTable() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="space-y-4"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      <motion.header variants={fadeUp}>
        <h2
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.025em" }}
        >
          Complexity at a glance
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
          How the algorithms stack up.
        </p>
      </motion.header>
      <div
        className="overflow-x-auto rounded-2xl"
        style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <table className="w-full text-xs sm:text-sm">
          <thead style={{ background: "oklch(1 0 0 / 4%)" }}>
            <tr className="text-left" style={{ color: "oklch(0.65 0.04 255)" }}>
              <th className="p-3 font-semibold">Algorithm</th>
              <th className="p-3 font-mono">Best</th>
              <th className="p-3 font-mono">Average</th>
              <th className="p-3 font-mono">Worst</th>
              <th className="p-3 font-mono">Space</th>
            </tr>
          </thead>
          <tbody>
            {COMPLEXITY_TABLE.map((row) => (
              <motion.tr
                key={row.name}
                variants={fadeUp}
                whileHover={{ background: "oklch(0.72 0.19 255 / 8%)" }}
                className="border-t"
                style={{ borderColor: "oklch(1 0 0 / 6%)" }}
              >
                <td className="p-3 font-semibold">{row.name}</td>
                <td className="p-3 font-mono" style={{ color: "oklch(0.75 0.18 162)" }}>
                  {row.best}
                </td>
                <td className="p-3 font-mono" style={{ color: "oklch(0.82 0.18 85)" }}>
                  {row.avg}
                </td>
                <td className="p-3 font-mono" style={{ color: "oklch(0.68 0.22 22)" }}>
                  {row.worst}
                </td>
                <td className="p-3 font-mono" style={{ color: "oklch(0.7 0.04 255)" }}>
                  {row.space}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

// 4) Animated pseudocode stepper
const PSEUDO_STEPS = [
  { line: "function quickSort(a, lo, hi):", note: "Entry point" },
  { line: "  if lo >= hi: return", note: "Base case" },
  { line: "  pivot = a[hi]", note: "Choose last as pivot" },
  { line: "  i = lo - 1", note: "Boundary index" },
  { line: "  for j = lo to hi - 1:", note: "Scan range" },
  { line: "    if a[j] <= pivot: swap(a[++i], a[j])", note: "Partition" },
  { line: "  swap(a[i+1], a[hi])", note: "Place pivot" },
  { line: "  quickSort(a, lo, i);  quickSort(a, i+2, hi)", note: "Recurse" },
];
function PseudoStepper() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % PSEUDO_STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="space-y-4"
    >
      <header>
        <h2
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.025em" }}
        >
          Pseudocode in motion
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
          Watch Quick Sort step through its own code.
        </p>
      </header>
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{ background: "oklch(0.07 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
      >
        <pre className="text-xs sm:text-sm font-mono leading-7 whitespace-pre-wrap">
          {PSEUDO_STEPS.map((s, k) => (
            <motion.div
              key={k}
              animate={{
                color: k === i ? "oklch(0.95 0.01 255)" : "oklch(0.5 0.04 255)",
                background: k === i ? "oklch(0.72 0.19 255 / 12%)" : "transparent",
                x: k === i ? 4 : 0,
              }}
              transition={{ duration: 0.25 }}
              className="px-2 rounded-md flex items-center justify-between gap-4"
            >
              <span>{s.line}</span>
              {k === i && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: "oklch(0.75 0.18 162)" }}
                >
                  ◀ {s.note}
                </motion.span>
              )}
            </motion.div>
          ))}
        </pre>
      </div>
    </motion.section>
  );
}

// 5) Algorithm timeline (history)
const TIMELINE = [
  { year: "1945", who: "von Neumann", what: "Merge Sort" },
  { year: "1956", who: "Kruskal", what: "Minimum spanning tree" },
  { year: "1959", who: "Dijkstra", what: "Shortest path algorithm" },
  { year: "1960", who: "Hoare", what: "Quick Sort" },
  { year: "1962", who: "Floyd", what: "Floyd-Warshall" },
  { year: "1968", who: "Hart/Nilsson/Raphael", what: "A* Search" },
  { year: "1977", who: "Knuth/Morris/Pratt", what: "KMP string search" },
];
function Timeline() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="space-y-4"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.header variants={fadeUp}>
        <h2
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.025em" }}
        >
          A short history
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
          The minds behind the algorithms you're learning.
        </p>
      </motion.header>
      <div className="relative pl-6">
        <div
          className="absolute left-2 top-2 bottom-2 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, oklch(0.72 0.19 255 / 50%), transparent)",
          }}
        />
        <div className="space-y-3">
          {TIMELINE.map((t) => (
            <motion.div
              key={t.year}
              variants={fadeUp}
              whileHover={{ x: 4 }}
              className="relative rounded-xl p-3 pl-4"
              style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}
            >
              <span
                className="absolute -left-4.75 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                style={{
                  background: "oklch(0.72 0.19 255)",
                  boxShadow: "0 0 12px oklch(0.72 0.19 255 / 60%)",
                }}
              />
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: "oklch(0.85 0.15 255)" }}
                >
                  {t.year}
                </span>
                <span className="text-sm font-semibold">{t.what}</span>
                <span className="text-xs" style={{ color: "oklch(0.55 0.04 255)" }}>
                  — {t.who}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── Original data ─────────────────────────────────────────────────────────
const cards = [
  {
    to: "/sorting",
    title: "Sorting",
    desc: "Bubble, Selection, Insertion, Merge, Quick, Heap and 7 more",
    icon: "⟨⟩",
    accent: "oklch(0.72 0.19 255)",
    glow: "oklch(0.72 0.19 255 / 15%)",
    tag: "13 algorithms",
  },
  {
    to: "/searching",
    title: "Searching",
    desc: "Linear, Binary, Jump, Exponential, Ternary, Interpolation",
    icon: "⌕",
    accent: "oklch(0.75 0.18 162)",
    glow: "oklch(0.75 0.18 162 / 15%)",
    tag: "6 algorithms",
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
    desc: "DFS, BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim, Kruskal",
    icon: "⬡",
    accent: "oklch(0.75 0.18 310)",
    glow: "oklch(0.75 0.18 310 / 15%)",
    tag: "9 algorithms",
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
    desc: "Naive, KMP, Rabin-Karp, Z-Algorithm, Boyer-Moore, Manacher",
    icon: "Σ",
    accent: "oklch(0.82 0.22 60)",
    glow: "oklch(0.82 0.22 60 / 15%)",
    tag: "6 algorithms",
  },
  {
    to: "/nqueens",
    title: "N-Queens",
    desc: "Classic backtracking solver on an interactive board",
    icon: "♛",
    accent: "oklch(0.82 0.18 85)",
    glow: "oklch(0.82 0.18 85 / 15%)",
    tag: "Backtracking",
  },
  {
    to: "/knights",
    title: "Knight's Tour",
    desc: "Warnsdorff's heuristic visits every chessboard square",
    icon: "♞",
    accent: "oklch(0.72 0.22 180)",
    glow: "oklch(0.72 0.22 180 / 15%)",
    tag: "Chess",
  },
  {
    to: "/hanoi",
    title: "Tower of Hanoi",
    desc: "Recursive disk moves with an animated 3-peg solution",
    icon: "⌬",
    accent: "oklch(0.75 0.18 310)",
    glow: "oklch(0.75 0.18 310 / 15%)",
    tag: "Recursion",
  },
] as const;

const stats = [
  { value: "60+", label: "Algorithms" },
  { value: "10", label: "Categories" },
  { value: "60fps", label: "Animations" },
  { value: "⌘", label: "C++ Code" },
];

const features = [
  {
    icon: "▶",
    title: "Step-by-step playback",
    desc: "Play, pause, step forward or back. Adjust speed at any time to slow down the tricky parts.",
  },
  {
    icon: "⌘",
    title: "Live C++ STL code",
    desc: "Each visualization is paired with clean, well-commented C++ using STL you can read, copy, or download.",
  },
  {
    icon: "✦",
    title: "Synced line highlighting",
    desc: "As the visualization runs, the matching line in the C++ source lights up so the algorithm makes sense.",
  },
  {
    icon: "⌗",
    title: "Custom inputs",
    desc: "Type your own arrays, draw obstacles on pathfinding grids, and pick from sample graphs.",
  },
  {
    icon: "⏱",
    title: "Complexity badges",
    desc: "Time and space complexity are shown next to every algorithm so trade-offs are obvious.",
  },
  {
    icon: "📱",
    title: "Fully responsive",
    desc: "Looks and feels great on phone, tablet, laptop, monitor — code panel adapts to your screen.",
  },
];

const howSteps = [
  {
    n: "01",
    title: "Pick a category",
    desc: "Choose Sorting, Searching, Graphs, DP and more from the sidebar.",
  },
  {
    n: "02",
    title: "Pick an algorithm",
    desc: "Each category ships with multiple classic algorithms to compare side-by-side.",
  },
  {
    n: "03",
    title: "Press play",
    desc: "Watch it run. Step backwards, adjust speed, or jump frame-by-frame.",
  },
  {
    n: "04",
    title: "Read the code",
    desc: "The C++ panel highlights the line that is currently executing.",
  },
];

const topics = [
  "Quick Sort",
  "Merge Sort",
  "Heap Sort",
  "Radix Sort",
  "Counting Sort",
  "Binary Search",
  "Jump Search",
  "Interpolation Search",
  "BFS",
  "DFS",
  "Dijkstra",
  "A*",
  "Bellman-Ford",
  "Floyd-Warshall",
  "Prim MST",
  "Kruskal MST",
  "KMP",
  "Rabin-Karp",
  "Z-Algorithm",
  "Boyer-Moore",
  "Manacher",
  "Sieve",
  "GCD",
  "Fast Power",
  "Fenwick Tree",
  "Segment Tree",
  "Fibonacci DP",
  "Knapsack",
  "LCS",
  "Edit Distance",
  "Coin Change",
  "LIS",
  "Matrix Chain",
  "Rod Cutting",
];

// ─── Motion variants ──────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 18 },
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────
function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8 overflow-hidden">
      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="text-center space-y-5 relative"
      >
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
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-170 h-170 rounded-full blur-3xl opacity-10"
            style={{
              background:
                "conic-gradient(from 0deg, oklch(0.72 0.19 255), oklch(0.75 0.18 162), oklch(0.82 0.18 85), oklch(0.72 0.19 255))",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{
              background: "oklch(0.72 0.19 255 / 12%)",
              color: "oklch(0.72 0.19 255)",
              border: "1px solid oklch(0.72 0.19 255 / 25%)",
            }}
          >
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
          See algorithms <span className="shimmer-text">think</span>.<br />
          <span
            className="text-2xl sm:text-3xl md:text-4xl"
            style={{ color: "oklch(0.65 0.04 255)" }}
          >
            Read the C++ <span style={{ color: "oklch(0.72 0.19 255)" }}>line-by-line</span>.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mx-auto max-w-xl text-sm sm:text-base"
          style={{ color: "oklch(0.60 0.04 255)" }}
        >
          Step through 60+ classic algorithms in real-time. Every animation is paired with the
          matching C++ STL implementation — and the currently-executing line lights up as you watch.
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
            style={{
              background: "oklch(0.72 0.19 255)",
              color: "oklch(0.08 0.02 265)",
              boxShadow: "0 0 24px oklch(0.72 0.19 255 / 30%)",
            }}
          >
            Start Visualizing{" "}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
          <Link
            to="/graph"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "oklch(1 0 0 / 6%)",
              color: "oklch(0.85 0.01 255)",
              border: "1px solid oklch(1 0 0 / 10%)",
            }}
          >
            Try Graph Algorithms
          </Link>
        </motion.div>

        {/* Three.js hero — toggleable Quick Sort / Binary Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mx-auto mt-10 max-w-3xl rounded-2xl overflow-hidden relative"
          style={{
            background: "oklch(0.08 0.02 265)",
            border: "1px solid oklch(1 0 0 / 10%)",
            height: "360px",
          }}
        >
          <div
            className="absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
            style={{ background: "oklch(0.72 0.19 255)", transform: "translate(-30%, -30%)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ background: "oklch(0.75 0.18 162)", transform: "translate(30%, 30%)" }}
          />
          <ThreeScene />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-4 pointer-events-none">
            {[
              { dot: "#ffd34d", label: "Compare / Probe" },
              { dot: "#ff6b5e", label: "Swap" },
              { dot: "#3ddc97", label: "Sorted / Found" },
              { dot: "#5a7cff", label: "Search Range" },
            ].map(({ dot, label }) => (
              <span
                key={label}
                className="flex items-center gap-1 text-[10px] font-mono"
                style={{ color: "oklch(0.50 0.04 255)" }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: dot }}
                />
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* Stats */}
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
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "oklch(0.72 0.19 255)", letterSpacing: "-0.03em" }}
            >
              {s.value}
            </span>
            <span className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 255)" }}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Big-O Playground (new) */}
      <BigOPlayground />

      {/* Cards */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Explore by category
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Ten sections, dozens of algorithms — every one with a synced C++ panel.
          </p>
        </motion.header>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <motion.div
              key={c.to}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
            >
              <Link
                to={c.to}
                className="group relative block rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: "oklch(0.12 0.025 265)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    `0 8px 32px ${c.glow}, 0 0 0 1px ${c.accent}30`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`,
                  }}
                />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <motion.span
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="text-xl"
                          style={{ color: c.accent }}
                        >
                          {c.icon}
                        </motion.span>
                        <h3
                          className="text-base sm:text-lg font-semibold tracking-tight"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          {c.title}
                        </h3>
                      </div>
                      <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
                        {c.desc}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${c.accent}18`, color: c.accent }}
                    >
                      {c.tag}
                    </span>
                  </div>
                  <div
                    className="mt-4 flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: c.accent }}
                  >
                    Explore{" "}
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* New animated section #1 */}
      <SortRace />

      {/* Features */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            What you get
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Designed to make algorithms click — not just watch them move.
          </p>
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
              >
                {f.icon}
              </motion.div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">{f.title}</h3>
              <p className="text-xs sm:text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* New animated section #2 */}
      <Spotlight />

      {/* How it works */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            How it works
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Four steps from curious to confident.
          </p>
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
              >
                {s.n}
              </motion.div>
              <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-xs" style={{ color: "oklch(0.55 0.04 255)" }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* New animated section #3 */}
      <ComplexityTable />

      {/* Topics marquee */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <header>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Everything covered
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            A peek at the algorithms waiting for you.
          </p>
        </header>
        <div
          className="relative overflow-hidden rounded-2xl py-5"
          style={{
            background: "oklch(0.10 0.02 265)",
            border: "1px solid oklch(1 0 0 / 8%)",
            maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <motion.div
            className="flex gap-2 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
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

      {/* New animated section #4 */}
      <PseudoStepper />

      {/* Tech stack */}
      <motion.section
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="space-y-4"
      >
        <motion.header variants={fadeUp}>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Built with
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            Modern tooling for a snappy experience.
          </p>
        </motion.header>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "TanStack Start", c: "oklch(0.72 0.19 255)" },
            { name: "React 19", c: "oklch(0.75 0.18 162)" },
            { name: "TypeScript", c: "oklch(0.72 0.19 255)" },
            { name: "Tailwind CSS", c: "oklch(0.75 0.18 200)" },
            { name: "Framer Motion", c: "oklch(0.82 0.18 85)" },
            { name: "Three.js", c: "oklch(0.82 0.22 60)" },
            { name: "Vite", c: "oklch(0.72 0.22 20)" },
            { name: "C++ STL", c: "oklch(0.72 0.22 180)" },
          ].map((tech) => (
            <motion.span
              key={tech.name}
              variants={popIn}
              whileHover={{ scale: 1.08, y: -2 }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-default"
              style={{ background: `${tech.c}14`, color: tech.c, border: `1px solid ${tech.c}30` }}
            >
              {tech.name}
            </motion.span>
          ))}
        </div>
      </motion.section>

      {/* New animated section #5 */}
      <Timeline />

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.12 0.04 265) 0%, oklch(0.10 0.02 265) 100%)",
          border: "1px solid oklch(1 0 0 / 10%)",
        }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -z-10 opacity-25"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, oklch(0.72 0.19 255 / 40%), transparent 50%)",
          }}
        />
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.025em" }}
        >
          Ready to see your first algorithm?
        </h2>
        <p className="text-sm mt-2 mx-auto max-w-md" style={{ color: "oklch(0.60 0.04 255)" }}>
          Bubble sort is a great place to start. Then graduate to graphs and DP when you're hooked.
        </p>
        <div className="mt-5 flex justify-center gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/sorting"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)" }}
            >
              Open Sorting →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/graph"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: "oklch(1 0 0 / 6%)",
                color: "oklch(0.85 0.01 255)",
                border: "1px solid oklch(1 0 0 / 10%)",
              }}
            >
              Or jump to Graphs
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
