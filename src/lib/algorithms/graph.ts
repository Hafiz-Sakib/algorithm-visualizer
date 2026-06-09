// Graph algorithms on adjacency list representation
export type GraphNode = { id: number; label: string; x: number; y: number };
export type GraphEdge = { from: number; to: number; weight?: number };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; directed?: boolean };

export type GraphStep = {
  visited: number[];
  visiting?: number;
  stack?: number[];
  queue?: number[];
  path?: number[];
  highlight?: [number, number][];
  order?: number[];
  components?: number[][];
  message?: string;
};

function adjList(g: Graph): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (const n of g.nodes) adj.set(n.id, []);
  for (const e of g.edges) {
    adj.get(e.from)!.push(e.to);
    if (!g.directed) adj.get(e.to)!.push(e.from);
  }
  return adj;
}

export function* dfsGraph(g: Graph, startId = 0): Generator<GraphStep> {
  const adj = adjList(g);
  const visited: number[] = [];
  const stack = [startId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.includes(cur)) continue;
    visited.push(cur);
    yield { visited: [...visited], visiting: cur, stack: [...stack] };
    const neighbors = (adj.get(cur) ?? []).filter(n => !visited.includes(n));
    for (const n of [...neighbors].reverse()) stack.push(n);
  }
  yield { visited: [...visited], order: [...visited], message: "DFS complete" };
}

export function* bfsGraph(g: Graph, startId = 0): Generator<GraphStep> {
  const adj = adjList(g);
  const visited: number[] = [startId];
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift()!;
    yield { visited: [...visited], visiting: cur, queue: [...queue] };
    for (const n of adj.get(cur) ?? []) {
      if (!visited.includes(n)) { visited.push(n); queue.push(n); }
    }
  }
  yield { visited: [...visited], order: [...visited], message: "BFS complete" };
}

export function* topoSort(g: Graph): Generator<GraphStep> {
  const adj = adjList(g);
  const inDeg = new Map<number, number>();
  for (const n of g.nodes) inDeg.set(n.id, 0);
  for (const e of g.edges) inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
  const queue = g.nodes.filter(n => inDeg.get(n.id) === 0).map(n => n.id);
  const order: number[] = []; const visited: number[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur); visited.push(cur);
    yield { visited: [...visited], visiting: cur, queue: [...queue], order: [...order] };
    for (const n of adj.get(cur) ?? []) {
      inDeg.set(n, (inDeg.get(n) ?? 1) - 1);
      if (inDeg.get(n) === 0) queue.push(n);
    }
  }
  const hasCycle = order.length < g.nodes.length;
  yield { visited: [...visited], order: [...order], message: hasCycle ? "Cycle detected — no valid topological order" : `Order: ${order.join(" → ")}` };
}

export function* cycleDetection(g: Graph): Generator<GraphStep> {
  const adj = adjList(g);
  const visited: number[] = []; const recStack: number[] = [];
  let cycleFound = false;
  function* dfs(v: number): Generator<GraphStep> {
    visited.push(v); recStack.push(v);
    yield { visited: [...visited], visiting: v, stack: [...recStack] };
    for (const n of adj.get(v) ?? []) {
      if (!visited.includes(n)) { yield* dfs(n); }
      else if (recStack.includes(n)) {
        cycleFound = true;
        yield { visited: [...visited], visiting: n, stack: [...recStack], highlight: [[v, n]], message: `Cycle detected: ${n} → ... → ${v} → ${n}` };
      }
    }
    recStack.splice(recStack.indexOf(v), 1);
  }
  for (const node of g.nodes) { if (!visited.includes(node.id)) yield* dfs(node.id); }
  yield { visited: [...visited], message: cycleFound ? "Graph has a cycle" : "No cycle detected (DAG)" };
}

export function* dijkstraGraph(g: Graph, startId = 0): Generator<GraphStep> {
  const adj = new Map<number, {to: number, w: number}[]>();
  for (const n of g.nodes) adj.set(n.id, []);
  for (const e of g.edges) {
    adj.get(e.from)!.push({ to: e.to, w: e.weight ?? 1 });
    if (!g.directed) adj.get(e.to)!.push({ to: e.from, w: e.weight ?? 1 });
  }
  const dist = new Map<number, number>(g.nodes.map(n => [n.id, Infinity]));
  dist.set(startId, 0);
  const parent = new Map<number, number>();
  const visited: number[] = [];
  const open = new Set(g.nodes.map(n => n.id));
  while (open.size) {
    let u = -1, best = Infinity;
    for (const id of open) { const d = dist.get(id) ?? Infinity; if (d < best) { best = d; u = id; } }
    if (u === -1) break;
    open.delete(u); visited.push(u);
    yield { visited: [...visited], visiting: u, message: `dist[${u}] = ${dist.get(u)}` };
    for (const { to, w } of adj.get(u) ?? []) {
      const alt = (dist.get(u) ?? 0) + w;
      if (alt < (dist.get(to) ?? Infinity)) { dist.set(to, alt); parent.set(to, u); }
    }
  }
  yield { visited: [...visited], message: `Distances from ${startId}: ` + g.nodes.map(n => `${n.label}=${dist.get(n.id) === Infinity ? "∞" : dist.get(n.id)}`).join(", ") };
}

export function* primMST(g: Graph): Generator<GraphStep> {
  if (!g.nodes.length) return;
  const inMST = new Set<number>(); const mstEdges: [number, number][] = [];
  inMST.add(g.nodes[0].id);
  const visited = [g.nodes[0].id];
  yield { visited: [...visited], message: `Starting MST from node ${g.nodes[0].label}` };
  while (inMST.size < g.nodes.length) {
    let best: { w: number; from: number; to: number } | null = null;
    for (const e of g.edges) {
      const inA = inMST.has(e.from), inB = inMST.has(e.to);
      if (inA !== inB) {
        const w = e.weight ?? 1;
        if (!best || w < best.w) best = { w, from: e.from, to: e.to };
      }
    }
    if (!best) break;
    const newNode = inMST.has(best.from) ? best.to : best.from;
    inMST.add(newNode); visited.push(newNode); mstEdges.push([best.from, best.to]);
    yield { visited: [...visited], visiting: newNode, highlight: mstEdges, message: `Add edge (${best.from}↔${best.to}) w=${best.w}` };
  }
  yield { visited: [...visited], highlight: mstEdges, message: `MST complete — ${mstEdges.length} edges` };
}

export const GRAPH_ALGOS = {
  "DFS": dfsGraph, "BFS": bfsGraph, "Topological Sort": topoSort,
  "Cycle Detection": cycleDetection, "Dijkstra": dijkstraGraph, "Prim MST": primMST,
} as const;
export type GraphAlgoName = keyof typeof GRAPH_ALGOS;

// Sample graphs
export const SAMPLE_GRAPHS: Record<string, Graph> = {
  "Simple (6 nodes)": {
    nodes: [
      { id: 0, label: "A", x: 150, y: 80 }, { id: 1, label: "B", x: 300, y: 50 },
      { id: 2, label: "C", x: 450, y: 80 }, { id: 3, label: "C", x: 150, y: 220 },
      { id: 4, label: "D", x: 300, y: 250 }, { id: 5, label: "E", x: 450, y: 220 },
    ],
    edges: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 0, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 2, to: 5 }, { from: 1, to: 4 },
    ],
  },
  "DAG (Topo)": {
    directed: true,
    nodes: [
      { id: 0, label: "A", x: 100, y: 150 }, { id: 1, label: "B", x: 230, y: 70 },
      { id: 2, label: "C", x: 230, y: 230 }, { id: 3, label: "D", x: 370, y: 70 },
      { id: 4, label: "E", x: 370, y: 230 }, { id: 5, label: "F", x: 500, y: 150 },
    ],
    edges: [{ from:0, to:1 }, { from:0, to:2 }, { from:1, to:3 }, { from:2, to:4 }, { from:3, to:5 }, { from:4, to:5 }],
  },
  "Weighted (Dijkstra)": {
    nodes: [
      { id: 0, label: "S", x: 80, y: 160 }, { id: 1, label: "A", x: 220, y: 60 },
      { id: 2, label: "B", x: 220, y: 260 }, { id: 3, label: "C", x: 380, y: 60 },
      { id: 4, label: "D", x: 380, y: 260 }, { id: 5, label: "T", x: 520, y: 160 },
    ],
    edges: [
      { from:0, to:1, weight:4 }, { from:0, to:2, weight:2 }, { from:1, to:3, weight:3 },
      { from:1, to:2, weight:1 }, { from:2, to:4, weight:5 }, { from:3, to:5, weight:2 },
      { from:4, to:3, weight:1 }, { from:4, to:5, weight:4 },
    ],
  },
};
