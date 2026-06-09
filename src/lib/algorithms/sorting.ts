// Sorting step generators.
// Each algorithm yields {array, compare, swap, sorted} snapshots so the UI
// can animate state transitions step-by-step.

export type SortStep = {
  array: number[];
  compare?: [number, number];
  swap?: [number, number];
  sorted: number[];
  pivot?: number;
};

export type SortGen = Generator<SortStep, void, unknown>;

export function* bubbleSort(a: number[]): SortGen {
  const arr = [...a];
  const n = arr.length;
  const sorted: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      yield { array: [...arr], compare: [j, j + 1], sorted: [...sorted] };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { array: [...arr], swap: [j, j + 1], sorted: [...sorted] };
      }
    }
    sorted.unshift(n - 1 - i);
  }
  sorted.unshift(0);
  yield { array: [...arr], sorted: arr.map((_, i) => i) };
}

export function* selectionSort(a: number[]): SortGen {
  const arr = [...a];
  const n = arr.length;
  const sorted: number[] = [];
  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      yield { array: [...arr], compare: [min, j], sorted: [...sorted] };
      if (arr[j] < arr[min]) min = j;
    }
    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]];
      yield { array: [...arr], swap: [i, min], sorted: [...sorted] };
    }
    sorted.push(i);
  }
  yield { array: [...arr], sorted: arr.map((_, i) => i) };
}

export function* insertionSort(a: number[]): SortGen {
  const arr = [...a];
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { array: [...arr], compare: [j - 1, j], sorted: [] };
      if (arr[j - 1] > arr[j]) {
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        yield { array: [...arr], swap: [j - 1, j], sorted: [] };
        j--;
      } else break;
    }
  }
  yield { array: [...arr], sorted: arr.map((_, i) => i) };
}

export function* mergeSort(a: number[]): SortGen {
  const arr = [...a];
  function* sort(l: number, r: number): SortGen {
    if (r - l < 1) return;
    const m = Math.floor((l + r) / 2);
    yield* sort(l, m);
    yield* sort(m + 1, r);
    const tmp: number[] = [];
    let i = l, j = m + 1;
    while (i <= m && j <= r) {
      yield { array: [...arr], compare: [i, j], sorted: [] };
      if (arr[i] <= arr[j]) tmp.push(arr[i++]); else tmp.push(arr[j++]);
    }
    while (i <= m) tmp.push(arr[i++]);
    while (j <= r) tmp.push(arr[j++]);
    for (let k = 0; k < tmp.length; k++) {
      arr[l + k] = tmp[k];
      yield { array: [...arr], swap: [l + k, l + k], sorted: [] };
    }
  }
  yield* sort(0, arr.length - 1);
  yield { array: [...arr], sorted: arr.map((_, i) => i) };
}

export function* quickSort(a: number[]): SortGen {
  const arr = [...a];
  function* qs(l: number, r: number): SortGen {
    if (l >= r) return;
    const pivot = arr[r];
    let i = l;
    for (let j = l; j < r; j++) {
      yield { array: [...arr], compare: [j, r], pivot: r, sorted: [] };
      if (arr[j] < pivot) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        yield { array: [...arr], swap: [i, j], pivot: r, sorted: [] };
        i++;
      }
    }
    [arr[i], arr[r]] = [arr[r], arr[i]];
    yield { array: [...arr], swap: [i, r], sorted: [] };
    yield* qs(l, i - 1);
    yield* qs(i + 1, r);
  }
  yield* qs(0, arr.length - 1);
  yield { array: [...arr], sorted: arr.map((_, i) => i) };
}

export const SORTERS = {
  Bubble: bubbleSort,
  Selection: selectionSort,
  Insertion: insertionSort,
  Merge: mergeSort,
  Quick: quickSort,
} as const;

export type SortName = keyof typeof SORTERS;