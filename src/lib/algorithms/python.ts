// Python reference implementations for every visualized algorithm.
// Standard library only. Used by <PythonCodePanel />.

export type PySection =
  | "sorting"
  | "searching"
  | "strings"
  | "tree"
  | "graph"
  | "pathfinding"
  | "dp";

export interface PySnippet {
  code: string;
  time: string;
  space: string;
}

const s = (str: string) => str.replace(/^\n/, "").replace(/\n {0,4}$/, "");

export const PYTHON_CODES: Record<PySection, Record<string, PySnippet>> = {
  // ────────────────────────────── SORTING ──────────────────────────────
  sorting: {
    Bubble: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def bubble_sort(arr):
    """Repeatedly swap adjacent out-of-order pairs."""
    n = len(arr)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:           # already sorted
            break
    return arr
`),
    },
    Selection: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def selection_sort(arr):
    """Each pass selects the minimum of the unsorted suffix."""
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr
`),
    },
    Insertion: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def insertion_sort(arr):
    """Insert each element into its place in the sorted prefix."""
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr
`),
    },
    Merge: {
      time: "O(n log n)",
      space: "O(n)",
      code: s(`
def merge_sort(arr):
    """Divide-and-conquer: split, sort halves, then merge."""
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return _merge(left, right)

def _merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
`),
    },
    Quick: {
      time: "O(n log n) avg",
      space: "O(log n)",
      code: s(`
def quick_sort(arr, lo=0, hi=None):
    """In-place Lomuto partition scheme."""
    if hi is None:
        hi = len(arr) - 1
    if lo < hi:
        p = _partition(arr, lo, hi)
        quick_sort(arr, lo, p - 1)
        quick_sort(arr, p + 1, hi)
    return arr

def _partition(arr, lo, hi):
    pivot = arr[hi]
    i = lo - 1
    for j in range(lo, hi):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[hi] = arr[hi], arr[i + 1]
    return i + 1
`),
    },
    Heap: {
      time: "O(n log n)",
      space: "O(1)",
      code: s(`
def heap_sort(arr):
    """Build a max-heap, then pop the max to the end repeatedly."""
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        _sift_down(arr, i, n)
    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]
        _sift_down(arr, 0, end)
    return arr

def _sift_down(arr, root, size):
    while True:
        left, right = 2 * root + 1, 2 * root + 2
        largest = root
        if left < size and arr[left] > arr[largest]:
            largest = left
        if right < size and arr[right] > arr[largest]:
            largest = right
        if largest == root:
            return
        arr[root], arr[largest] = arr[largest], arr[root]
        root = largest
`),
    },
    Shell: {
      time: "O(n^1.5)",
      space: "O(1)",
      code: s(`
def shell_sort(arr):
    """Gapped insertion sort with halving gap sequence."""
    n = len(arr)
    gap = n // 2
    while gap > 0:
        for i in range(gap, n):
            tmp, j = arr[i], i
            while j >= gap and arr[j - gap] > tmp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = tmp
        gap //= 2
    return arr
`),
    },
    Counting: {
      time: "O(n + k)",
      space: "O(n + k)",
      code: s(`
def counting_sort(arr):
    """Non-comparison sort for bounded integer keys."""
    if not arr:
        return arr
    lo, hi = min(arr), max(arr)
    count = [0] * (hi - lo + 1)
    for x in arr:
        count[x - lo] += 1
    out, idx = [0] * len(arr), 0
    for v, c in enumerate(count):
        for _ in range(c):
            out[idx] = v + lo
            idx += 1
    return out
`),
    },
    Radix: {
      time: "O(d·(n + b))",
      space: "O(n + b)",
      code: s(`
def radix_sort(arr, base=10):
    """LSD radix sort using counting sort per digit."""
    if not arr:
        return arr
    max_val = max(arr)
    exp = 1
    while max_val // exp > 0:
        arr = _counting_by_digit(arr, exp, base)
        exp *= base
    return arr

def _counting_by_digit(arr, exp, base):
    count = [0] * base
    for x in arr:
        count[(x // exp) % base] += 1
    for i in range(1, base):
        count[i] += count[i - 1]
    out = [0] * len(arr)
    for x in reversed(arr):
        d = (x // exp) % base
        count[d] -= 1
        out[count[d]] = x
    return out
`),
    },
    Cocktail: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def cocktail_sort(arr):
    """Bidirectional bubble sort."""
    lo, hi = 0, len(arr) - 1
    swapped = True
    while swapped:
        swapped = False
        for i in range(lo, hi):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
        if not swapped:
            break
        swapped = False
        hi -= 1
        for i in range(hi, lo, -1):
            if arr[i - 1] > arr[i]:
                arr[i - 1], arr[i] = arr[i], arr[i - 1]
                swapped = True
        lo += 1
    return arr
`),
    },
    Gnome: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def gnome_sort(arr):
    """Walk forward; on inversion, swap and step back."""
    i, n = 0, len(arr)
    while i < n:
        if i == 0 or arr[i - 1] <= arr[i]:
            i += 1
        else:
            arr[i - 1], arr[i] = arr[i], arr[i - 1]
            i -= 1
    return arr
`),
    },
    Comb: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def comb_sort(arr):
    """Bubble sort with shrinking gap (shrink factor 1.3)."""
    n = len(arr)
    gap = n
    swapped = True
    while gap > 1 or swapped:
        gap = max(1, int(gap / 1.3))
        swapped = False
        for i in range(n - gap):
            if arr[i] > arr[i + gap]:
                arr[i], arr[i + gap] = arr[i + gap], arr[i]
                swapped = True
    return arr
`),
    },
    Cycle: {
      time: "O(n²)",
      space: "O(1)",
      code: s(`
def cycle_sort(arr):
    """Minimal-writes sort by routing elements to their final slot."""
    n = len(arr)
    for start in range(n - 1):
        item = arr[start]
        pos = start + sum(1 for i in range(start + 1, n) if arr[i] < item)
        if pos == start:
            continue
        while item == arr[pos]:
            pos += 1
        arr[pos], item = item, arr[pos]
        while pos != start:
            pos = start + sum(1 for i in range(start + 1, n) if arr[i] < item)
            while item == arr[pos]:
                pos += 1
            arr[pos], item = item, arr[pos]
    return arr
`),
    },
  },

  // ────────────────────────────── SEARCHING ──────────────────────────────
  searching: {
    Linear: {
      time: "O(n)",
      space: "O(1)",
      code: s(`
def linear_search(arr, target):
    """Scan left-to-right for the target."""
    for i, v in enumerate(arr):
        if v == target:
            return i
    return -1
`),
    },
    Binary: {
      time: "O(log n)",
      space: "O(1)",
      code: s(`
def binary_search(arr, target):
    """Requires arr to be sorted ascending."""
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`),
    },
    Jump: {
      time: "O(√n)",
      space: "O(1)",
      code: s(`
import math

def jump_search(arr, target):
    """Jump ahead by sqrt(n) blocks, then linear scan."""
    n = len(arr)
    step = int(math.sqrt(n))
    prev = 0
    while prev < n and arr[min(step, n) - 1] < target:
        prev = step
        step += int(math.sqrt(n))
        if prev >= n:
            return -1
    for i in range(prev, min(step, n)):
        if arr[i] == target:
            return i
    return -1
`),
    },
    Exponential: {
      time: "O(log n)",
      space: "O(1)",
      code: s(`
def exponential_search(arr, target):
    """Find a range by doubling, then binary search within it."""
    n = len(arr)
    if n == 0:
        return -1
    if arr[0] == target:
        return 0
    i = 1
    while i < n and arr[i] <= target:
        i *= 2
    lo, hi = i // 2, min(i, n - 1)
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`),
    },
    Ternary: {
      time: "O(log₃ n)",
      space: "O(1)",
      code: s(`
def ternary_search(arr, target):
    """Split the range into thirds each step."""
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        third = (hi - lo) // 3
        m1 = lo + third
        m2 = hi - third
        if arr[m1] == target:
            return m1
        if arr[m2] == target:
            return m2
        if target < arr[m1]:
            hi = m1 - 1
        elif target > arr[m2]:
            lo = m2 + 1
        else:
            lo, hi = m1 + 1, m2 - 1
    return -1
`),
    },
    Interpolation: {
      time: "O(log log n) avg",
      space: "O(1)",
      code: s(`
def interpolation_search(arr, target):
    """Estimate position assuming uniform distribution."""
    lo, hi = 0, len(arr) - 1
    while lo <= hi and arr[lo] <= target <= arr[hi]:
        if lo == hi:
            return lo if arr[lo] == target else -1
        pos = lo + ((target - arr[lo]) * (hi - lo)) // (arr[hi] - arr[lo])
        if arr[pos] == target:
            return pos
        if arr[pos] < target:
            lo = pos + 1
        else:
            hi = pos - 1
    return -1
`),
    },
  },

  // ────────────────────────────── STRINGS ──────────────────────────────
  strings: {
    Naive: {
      time: "O(n·m)",
      space: "O(1)",
      code: s(`
def naive_search(text, pattern):
    """Check every alignment of pattern in text."""
    n, m = len(text), len(pattern)
    matches = []
    for i in range(n - m + 1):
        j = 0
        while j < m and text[i + j] == pattern[j]:
            j += 1
        if j == m:
            matches.append(i)
    return matches
`),
    },
    KMP: {
      time: "O(n + m)",
      space: "O(m)",
      code: s(`
def kmp_search(text, pattern):
    """Knuth-Morris-Pratt: skip ahead using failure table."""
    lps = _build_lps(pattern)
    matches, i, j = [], 0, 0
    while i < len(text):
        if text[i] == pattern[j]:
            i += 1; j += 1
            if j == len(pattern):
                matches.append(i - j)
                j = lps[j - 1]
        elif j > 0:
            j = lps[j - 1]
        else:
            i += 1
    return matches

def _build_lps(pattern):
    """Longest proper prefix that is also a suffix, per index."""
    lps = [0] * len(pattern)
    length = 0
    for i in range(1, len(pattern)):
        while length > 0 and pattern[i] != pattern[length]:
            length = lps[length - 1]
        if pattern[i] == pattern[length]:
            length += 1
        lps[i] = length
    return lps
`),
    },
    "Rabin-Karp": {
      time: "O(n + m) avg",
      space: "O(1)",
      code: s(`
def rabin_karp(text, pattern, base=256, mod=10**9 + 7):
    """Rolling hash; verify on hash collision."""
    n, m = len(text), len(pattern)
    if m > n:
        return []
    high = pow(base, m - 1, mod)
    hp = ht = 0
    for k in range(m):
        hp = (hp * base + ord(pattern[k])) % mod
        ht = (ht * base + ord(text[k])) % mod
    matches = []
    for i in range(n - m + 1):
        if hp == ht and text[i:i + m] == pattern:
            matches.append(i)
        if i < n - m:
            ht = ((ht - ord(text[i]) * high) * base + ord(text[i + m])) % mod
    return matches
`),
    },
    "Z-Algorithm": {
      time: "O(n + m)",
      space: "O(n + m)",
      code: s(`
def z_search(text, pattern, sep="$"):
    """Build Z-array of pattern + sep + text and read off matches."""
    s = pattern + sep + text
    n = len(s)
    z = [0] * n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    m = len(pattern)
    return [i - m - 1 for i in range(m + 1, n) if z[i] == m]
`),
    },
  },

  // ────────────────────────────── TREE ──────────────────────────────
  tree: {
    BFS: {
      time: "O(n)",
      space: "O(n)",
      code: s(`
from collections import deque

def bfs(root):
    """Level-order traversal of a binary tree."""
    order = []
    if not root:
        return order
    q = deque([root])
    while q:
        node = q.popleft()
        order.append(node.value)
        if node.left:  q.append(node.left)
        if node.right: q.append(node.right)
    return order
`),
    },
    "DFS-In": {
      time: "O(n)",
      space: "O(h)",
      code: s(`
def inorder(root):
    """Left, root, right — sorted order for a BST."""
    out, stack, cur = [], [], root
    while stack or cur:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        out.append(cur.value)
        cur = cur.right
    return out
`),
    },
    "DFS-Pre": {
      time: "O(n)",
      space: "O(h)",
      code: s(`
def preorder(root):
    """Root, left, right."""
    if not root:
        return []
    out, stack = [], [root]
    while stack:
        node = stack.pop()
        out.append(node.value)
        if node.right: stack.append(node.right)
        if node.left:  stack.append(node.left)
    return out
`),
    },
    "DFS-Post": {
      time: "O(n)",
      space: "O(h)",
      code: s(`
def postorder(root):
    """Left, right, root — uses two stacks iteratively."""
    if not root:
        return []
    out, stack = [], [root]
    while stack:
        node = stack.pop()
        out.append(node.value)
        if node.left:  stack.append(node.left)
        if node.right: stack.append(node.right)
    return out[::-1]
`),
    },
  },

  // ────────────────────────────── GRAPH ──────────────────────────────
  graph: {
    DFS: {
      time: "O(V + E)",
      space: "O(V)",
      code: s(`
def dfs(graph, start):
    """Iterative DFS using an explicit stack."""
    visited, order, stack = set(), [], [start]
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        order.append(node)
        for nb in reversed(graph[node]):
            if nb not in visited:
                stack.append(nb)
    return order
`),
    },
    BFS: {
      time: "O(V + E)",
      space: "O(V)",
      code: s(`
from collections import deque

def bfs(graph, start):
    """BFS over an adjacency list."""
    visited = {start}
    order, q = [], deque([start])
    while q:
        node = q.popleft()
        order.append(node)
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)
                q.append(nb)
    return order
`),
    },
    "Topological Sort": {
      time: "O(V + E)",
      space: "O(V)",
      code: s(`
from collections import deque, defaultdict

def topological_sort(graph):
    """Kahn's algorithm — repeatedly remove nodes with indegree 0."""
    indeg = defaultdict(int)
    for u in graph:
        for v in graph[u]:
            indeg[v] += 1
    q = deque([u for u in graph if indeg[u] == 0])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if len(order) != len(graph):
        raise ValueError("graph has a cycle")
    return order
`),
    },
    "Cycle Detection": {
      time: "O(V + E)",
      space: "O(V)",
      code: s(`
def has_cycle(graph):
    """DFS coloring: WHITE -> GRAY -> BLACK. A back-edge = cycle."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {u: WHITE for u in graph}

    def dfs(u):
        color[u] = GRAY
        for v in graph[u]:
            if color[v] == GRAY:        # back edge
                return True
            if color[v] == WHITE and dfs(v):
                return True
        color[u] = BLACK
        return False

    return any(color[u] == WHITE and dfs(u) for u in graph)
`),
    },
    Dijkstra: {
      time: "O((V+E) log V)",
      space: "O(V)",
      code: s(`
import heapq

def dijkstra(graph, source):
    """Shortest paths from source on a non-negative weighted graph.
    graph: {node: [(neighbor, weight), ...]}"""
    dist = {u: float("inf") for u in graph}
    dist[source] = 0
    pq = [(0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist
`),
    },
    "Prim MST": {
      time: "O(E log V)",
      space: "O(V)",
      code: s(`
import heapq

def prim_mst(graph, start):
    """Minimum spanning tree of a connected, undirected weighted graph."""
    visited = {start}
    edges = [(w, start, v) for v, w in graph[start]]
    heapq.heapify(edges)
    mst, total = [], 0
    while edges and len(visited) < len(graph):
        w, u, v = heapq.heappop(edges)
        if v in visited:
            continue
        visited.add(v)
        mst.append((u, v, w))
        total += w
        for nv, nw in graph[v]:
            if nv not in visited:
                heapq.heappush(edges, (nw, v, nv))
    return mst, total
`),
    },
  },

  // ────────────────────────────── PATHFINDING ──────────────────────────────
  pathfinding: {
    BFS: {
      time: "O(rows·cols)",
      space: "O(rows·cols)",
      code: s(`
from collections import deque

def bfs_path(grid, start, goal):
    """Shortest path on an unweighted grid (4-connected)."""
    rows, cols = len(grid), len(grid[0])
    q = deque([start])
    parent = {start: None}
    while q:
        r, c = q.popleft()
        if (r, c) == goal:
            return _reconstruct(parent, goal)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols \\
               and grid[nr][nc] != 1 and (nr, nc) not in parent:
                parent[(nr, nc)] = (r, c)
                q.append((nr, nc))
    return []

def _reconstruct(parent, goal):
    path, cur = [], goal
    while cur is not None:
        path.append(cur)
        cur = parent[cur]
    return path[::-1]
`),
    },
    Dijkstra: {
      time: "O(N log N)",
      space: "O(N)",
      code: s(`
import heapq

def dijkstra_path(grid, start, goal):
    """Weighted shortest path; cell value = step cost."""
    rows, cols = len(grid), len(grid[0])
    dist = {start: 0}
    parent = {start: None}
    pq = [(0, start)]
    while pq:
        d, (r, c) = heapq.heappop(pq)
        if (r, c) == goal:
            return _reconstruct(parent, goal)
        if d > dist[(r, c)]:
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != 1:
                nd = d + max(1, grid[nr][nc])
                if nd < dist.get((nr, nc), float("inf")):
                    dist[(nr, nc)] = nd
                    parent[(nr, nc)] = (r, c)
                    heapq.heappush(pq, (nd, (nr, nc)))
    return []

def _reconstruct(parent, goal):
    path, cur = [], goal
    while cur is not None:
        path.append(cur); cur = parent[cur]
    return path[::-1]
`),
    },
    "A*": {
      time: "O(N log N)",
      space: "O(N)",
      code: s(`
import heapq

def a_star(grid, start, goal):
    """Heuristic search using Manhattan distance."""
    def h(p):
        return abs(p[0] - goal[0]) + abs(p[1] - goal[1])

    rows, cols = len(grid), len(grid[0])
    g = {start: 0}
    parent = {start: None}
    pq = [(h(start), 0, start)]
    while pq:
        _, gc, (r, c) = heapq.heappop(pq)
        if (r, c) == goal:
            return _reconstruct(parent, goal)
        if gc > g[(r, c)]:
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != 1:
                ng = gc + 1
                if ng < g.get((nr, nc), float("inf")):
                    g[(nr, nc)] = ng
                    parent[(nr, nc)] = (r, c)
                    heapq.heappush(pq, (ng + h((nr, nc)), ng, (nr, nc)))
    return []

def _reconstruct(parent, goal):
    path, cur = [], goal
    while cur is not None:
        path.append(cur); cur = parent[cur]
    return path[::-1]
`),
    },
  },

  // ────────────────────────────── DP ──────────────────────────────
  dp: {
    Fibonacci: {
      time: "O(n)",
      space: "O(n)",
      code: s(`
def fib(n):
    """Bottom-up DP for the nth Fibonacci number."""
    if n < 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
`),
    },
    LCS: {
      time: "O(n·m)",
      space: "O(n·m)",
      code: s(`
def lcs(a, b):
    """Length of the longest common subsequence."""
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[n][m]
`),
    },
    "0/1 Knapsack": {
      time: "O(n·W)",
      space: "O(n·W)",
      code: s(`
def knapsack_01(weights, values, capacity):
    """Maximum value with each item taken at most once."""
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1],
                )
    return dp[n][capacity]
`),
    },
    "Edit Distance": {
      time: "O(n·m)",
      space: "O(n·m)",
      code: s(`
def edit_distance(a, b):
    """Levenshtein distance (insert / delete / replace = 1)."""
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],      # delete
                    dp[i][j - 1],      # insert
                    dp[i - 1][j - 1],  # replace
                )
    return dp[n][m]
`),
    },
    "Coin Change": {
      time: "O(amount·|coins|)",
      space: "O(amount)",
      code: s(`
def coin_change(coins, amount):
    """Fewest coins to make 'amount', or -1 if impossible."""
    INF = float("inf")
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == INF else dp[amount]
`),
    },
    LIS: {
      time: "O(n log n)",
      space: "O(n)",
      code: s(`
from bisect import bisect_left

def lis(arr):
    """Length of the longest strictly increasing subsequence."""
    tails = []
    for x in arr:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)
`),
    },
  },
};
