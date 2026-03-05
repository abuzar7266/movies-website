# Coding Patterns: Interview Templates

## Arrays and Strings

- Two pointers: dedupe/remove, reverse-in-place, partition by predicate
- Sliding window: longest/shortest substrings satisfying constraints
- Prefix sums: range queries; difference arrays for interval updates

## Searching and Sorting

- Binary search boundaries: first/last occurrence, lower/upper bounds
- Quickselect: kth element; average O(n)
- Merge intervals: sort + single pass merge

## Graphs

- BFS shortest path (unweighted); level-order traversal
- DFS with visited set; cycle detection; topological sort (Kahn/DFS)
- Dijkstra for weighted shortest path; use heap
- Union-Find: connected components; detect cycles in undirected graphs

## Trees

- Traversals: inorder/preorder/postorder iterative with stack
- BST operations: insert/search/delete; invariant maintenance
- Lowest Common Ancestor: parent pointers or binary lifting

## Dynamic Programming

- 1D DP: knapsack, coin change, climbing stairs
- 2D DP: LIS variations, edit distance, matrix paths
- State compression: bitmask DP for subsets

## Greedy

- Intervals: activity selection; earliest end time wins
- Huffman coding: combine smallest weights with heap
- Monotonic stack: next greater/smaller elements; histogram max area

## Backtracking

- Permutations/combinations/subsets: choose/skip recursion
- Constraints: prune aggressively; track used elements

## Concurrency (High-Level)

- Producer-consumer: bounded queue; signaling; avoid deadlocks
- Reader-writer: lock hierarchy; fairness, starvation prevention

## Template Snippets (Pseudocode)

Topological Sort (Kahn)
```
in_deg = count_in_degrees(graph)
q = [nodes with in_deg == 0]
order = []
while q:
  u = q.pop(0)
  order.append(u)
  for v in graph[u]:
    in_deg[v] -= 1
    if in_deg[v] == 0: q.append(v)
```

Monotonic Stack (Next Greater)
```
stack = []
for i in range(n):
  while stack and nums[i] > nums[stack[-1]]:
    j = stack.pop()
    ans[j] = nums[i]
  stack.append(i)
```

