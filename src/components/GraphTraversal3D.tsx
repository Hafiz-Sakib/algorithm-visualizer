import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Interactive 3D BFS / DFS visualization on a small graph of orbiting nodes.
// Pure Three.js — no extra dependencies. Camera auto-orbits; user can toggle
// algorithm and replay traversal.

type Mode = "BFS" | "DFS";

const NODES = 14;
const EDGE_PROB = 0.22;
const RADIUS = 5.5;

interface Graph { adj: number[][]; }

function makeGraph(seed = 7): Graph {
  // deterministic-ish PRNG so SSR + client agree
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 0xffffff; };
  const adj: number[][] = Array.from({ length: NODES }, () => []);
  // backbone (ensures connectivity)
  for (let i = 1; i < NODES; i++) {
    const j = Math.floor(rand() * i);
    adj[i].push(j); adj[j].push(i);
  }
  // extra random edges
  for (let i = 0; i < NODES; i++)
    for (let j = i + 2; j < NODES; j++)
      if (rand() < EDGE_PROB && !adj[i].includes(j)) { adj[i].push(j); adj[j].push(i); }
  return { adj };
}

function bfsOrder(g: Graph, src: number) {
  const order: { node: number; from: number }[] = [{ node: src, from: -1 }];
  const seen = new Array(NODES).fill(false); seen[src] = true;
  const q = [src];
  while (q.length) {
    const u = q.shift()!;
    for (const v of g.adj[u]) if (!seen[v]) { seen[v] = true; q.push(v); order.push({ node: v, from: u }); }
  }
  return order;
}
function dfsOrder(g: Graph, src: number) {
  const order: { node: number; from: number }[] = [];
  const seen = new Array(NODES).fill(false);
  const stack: { node: number; from: number }[] = [{ node: src, from: -1 }];
  while (stack.length) {
    const { node, from } = stack.pop()!;
    if (seen[node]) continue;
    seen[node] = true; order.push({ node, from });
    for (const v of g.adj[node]) if (!seen[v]) stack.push({ node: v, from: node });
  }
  return order;
}

export function GraphTraversal3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("BFS");
  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 4, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(8, 12, 6); scene.add(key);
    const rim = new THREE.PointLight(0x6bb0ff, 1.4, 40); rim.position.set(-6, 4, -8); scene.add(rim);

    const g = makeGraph();
    // place nodes on a sphere
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < NODES; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      positions.push(new THREE.Vector3(
        RADIUS * Math.sin(phi) * Math.cos(theta),
        RADIUS * Math.cos(phi),
        RADIUS * Math.sin(phi) * Math.sin(theta),
      ));
    }

    // Edges
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3a4a6a, transparent: true, opacity: 0.55 });
    const edgeObjs: { line: THREE.Line; a: number; b: number; mat: THREE.LineBasicMaterial }[] = [];
    const seenEdge = new Set<string>();
    for (let i = 0; i < NODES; i++)
      for (const j of g.adj[i]) {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seenEdge.has(k)) continue; seenEdge.add(k);
        const mat = edgeMat.clone();
        const geom = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]);
        const line = new THREE.Line(geom, mat);
        scene.add(line);
        edgeObjs.push({ line, a: i, b: j, mat });
      }

    // Nodes
    const nodeGeom = new THREE.SphereGeometry(0.42, 32, 24);
    const nodeMats: THREE.MeshStandardMaterial[] = [];
    const nodes: THREE.Mesh[] = positions.map((p) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8ea4c4, emissive: 0x12203a, emissiveIntensity: 0.6,
        metalness: 0.3, roughness: 0.4,
      });
      nodeMats.push(mat);
      const m = new THREE.Mesh(nodeGeom, mat);
      m.position.copy(p);
      scene.add(m);
      return m;
    });

    let order = mode === "BFS" ? bfsOrder(g, 0) : dfsOrder(g, 0);
    let step = 0; let t0 = performance.now();
    const stepMs = 520;

    function applyStep(s: number) {
      // reset
      nodeMats.forEach((m) => { m.color.setHex(0x8ea4c4); m.emissive.setHex(0x12203a); m.emissiveIntensity = 0.5; });
      edgeObjs.forEach((e) => { e.mat.color.setHex(0x3a4a6a); e.mat.opacity = 0.45; });
      const visited = new Set<number>();
      const usedEdges = new Set<string>();
      for (let k = 0; k <= s && k < order.length; k++) {
        const { node, from } = order[k];
        visited.add(node);
        if (from !== -1) {
          const key = from < node ? `${from}-${node}` : `${node}-${from}`;
          usedEdges.add(key);
        }
      }
      const frontier = order[Math.min(s, order.length - 1)].node;
      visited.forEach((n) => {
        nodeMats[n].color.setHex(modeRef.current === "BFS" ? 0x6bb0ff : 0x7cdcb9);
        nodeMats[n].emissive.setHex(modeRef.current === "BFS" ? 0x12386a : 0x113b32);
        nodeMats[n].emissiveIntensity = 0.9;
      });
      nodeMats[frontier].color.setHex(0xffd166);
      nodeMats[frontier].emissive.setHex(0x7a5210); nodeMats[frontier].emissiveIntensity = 1.4;
      edgeObjs.forEach((e) => {
        const key = e.a < e.b ? `${e.a}-${e.b}` : `${e.b}-${e.a}`;
        if (usedEdges.has(key)) { e.mat.color.setHex(modeRef.current === "BFS" ? 0x6bb0ff : 0x7cdcb9); e.mat.opacity = 0.95; }
      });
      activeRef.current = s; setActive(s);
    }
    applyStep(0);

    // Pointer-drag orbit + auto-rotate
    let drag = false; let lastX = 0; let lastY = 0; let azim = 0; let elev = 0.25;
    function onDown(e: PointerEvent) { drag = true; lastX = e.clientX; lastY = e.clientY; }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      azim += (e.clientX - lastX) * 0.005;
      elev = Math.max(-1.2, Math.min(1.2, elev + (e.clientY - lastY) * 0.005));
      lastX = e.clientX; lastY = e.clientY;
    }
    function onUp() { drag = false; }
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    let lastModeSeen: Mode = modeRef.current;
    function tick(now: number) {
      // mode swap → rebuild order
      if (lastModeSeen !== modeRef.current) {
        lastModeSeen = modeRef.current;
        order = lastModeSeen === "BFS" ? bfsOrder(g, 0) : dfsOrder(g, 0);
        step = 0; t0 = now; applyStep(0);
      }
      if (!drag) azim += 0.0025;
      const r = 14;
      camera.position.x = r * Math.sin(azim) * Math.cos(elev);
      camera.position.z = r * Math.cos(azim) * Math.cos(elev);
      camera.position.y = r * Math.sin(elev) + 1.5;
      camera.lookAt(0, 0, 0);

      if (now - t0 > stepMs) {
        t0 = now; step = (step + 1) % (order.length + 6); // pause at end
        if (step < order.length) applyStep(step);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    let raf = requestAnimationFrame(tick);

    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.dispose(); mount.removeChild(renderer.domElement);
      nodeGeom.dispose(); nodeMats.forEach((m) => m.dispose());
      edgeObjs.forEach((e) => { e.mat.dispose(); e.line.geometry.dispose(); });
    };
  }, []);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>
            3D graph traversal — BFS vs DFS
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>
            A small graph on a sphere. Toggle algorithms and drag to orbit — visited nodes light up
            as the traversal expands, edges trace the spanning tree.
          </p>
        </div>
        <div className="inline-flex rounded-xl p-1" style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)" }}>
          {(["BFS", "DFS"] as Mode[]).map((m) => {
            const active = m === mode;
            const color = m === "BFS" ? "oklch(0.72 0.19 255)" : "oklch(0.75 0.18 162)";
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? `${color}24` : "transparent",
                  color: active ? color : "oklch(0.65 0.04 255)",
                  border: `1px solid ${active ? `${color}55` : "transparent"}`,
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </header>

      <div
        className="rounded-2xl overflow-hidden relative"
        style={{ background: "oklch(0.08 0.02 265)", border: "1px solid oklch(1 0 0 / 8%)", height: "min(60vh, 460px)" }}
      >
        <div ref={mountRef} className="absolute inset-0" />
        <div
          className="absolute bottom-2 left-3 right-3 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 pointer-events-none"
          style={{ color: "oklch(0.7 0.04 255)" }}
        >
          <span>step <span style={{ color: "oklch(0.9 0.02 255)" }}>{active + 1}</span> / {NODES}</span>
          <span>drag to orbit · auto-rotates when idle</span>
        </div>
      </div>
    </section>
  );
}
