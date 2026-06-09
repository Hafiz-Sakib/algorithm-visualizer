export type SearchStep = {
  array: number[];
  checking?: number;
  range?: [number, number];
  found?: number;
  eliminated: number[];
};

export function* linearSearch(arr: number[], target: number): Generator<SearchStep> {
  const eliminated: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    yield { array: arr, checking: i, eliminated: [...eliminated] };
    if (arr[i] === target) {
      yield { array: arr, found: i, eliminated: [...eliminated] };
      return;
    }
    eliminated.push(i);
  }
  yield { array: arr, eliminated: [...eliminated] };
}

export function* binarySearch(arr: number[], target: number): Generator<SearchStep> {
  // assumes sorted
  const eliminated: number[] = [];
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    yield { array: arr, checking: m, range: [l, r], eliminated: [...eliminated] };
    if (arr[m] === target) {
      yield { array: arr, found: m, eliminated: [...eliminated] };
      return;
    }
    if (arr[m] < target) {
      for (let i = l; i <= m; i++) eliminated.push(i);
      l = m + 1;
    } else {
      for (let i = m; i <= r; i++) eliminated.push(i);
      r = m - 1;
    }
  }
  yield { array: arr, eliminated: [...eliminated] };
}