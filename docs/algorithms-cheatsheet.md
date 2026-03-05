# Algorithms and Complexity Cheatsheet

## Big-O Quick Reference

- O(1): hash map access, array index
- O(log n): binary search, balanced BST operations
- O(n): scanning arrays/lists, counting
- O(n log n): sorting (quick/merge/heap), many divide-and-conquer
- O(n^2): nested loops over arrays (brute force)
- O(2^n)/O(n!): exponential, permutations/DFS over subsets

## Patterns

- Two Pointers: sorted arrays, partitioning, window expansion
- Sliding Window: substrings, subarrays with constraints
- Binary Search: monotonic predicates; lower/upper bounds
- BFS/DFS: graph traversal, shortest path on unweighted graphs (BFS)
- Dijkstra/Greedy: weighted shortest path; interval scheduling
- Prefix/Suffix: precompute sums/products/min/max for O(1) queries
- Union-Find: connectivity, cycle detection; path compression + union by rank
- Heap/Priority Queue: top-k, median maintenance, scheduling
- Dynamic Programming: overlapping subproblems; tabulation vs memoization
- Backtracking: permutations, combinations, constraint satisfaction

## Data Structures

- Array/List: contiguous memory; O(1) access
- Hash Map/Set: average O(1) insert/find; watch collisions
- Tree: balanced (AVL/Red-Black) vs unbalanced; ordered data, range queries
- Trie: prefix queries; autocomplete; lower memory with shared prefixes
- Queue/Deque: BFS, monotonic queue for sliding window max/min
- Graph: adjacency list vs matrix; sparse vs dense

## Templates (Pseudocode)

Binary Search
```
lo = 0; hi = n - 1
while lo <= hi:
  mid = (lo + hi) // 2
  if ok(mid): hi = mid - 1  # or adjust based on condition
  else: lo = mid + 1
return lo  # or hi depending on bound
```

Sliding Window
```
left = 0
for right in range(n):
  add(nums[right])
  while invalid():
    remove(nums[left]); left += 1
  update_answer()
```

BFS
```
q = [start]; seen = {start}
while q:
  node = q.pop(0)
  for nei in graph[node]:
    if nei not in seen:
      seen.add(nei); q.append(nei)
```

DP (Knapsack-like)
```
dp = [0]*(capacity+1)
for item in items:
  for c in reversed(range(weight[item], capacity+1)):
    dp[c] = max(dp[c], dp[c-weight[item]] + value[item])
```

