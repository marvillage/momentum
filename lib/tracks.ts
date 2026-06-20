// Curated, pre-linked problem/content tracks the activity wizard can auto-load.
// Each problem's URL is https://leetcode.com/problems/<slug>/ — canonical and stable.
// `b: 1` marks a problem that is also part of the Blind 75, so we derive that
// track by filtering instead of duplicating the list.

export type TrackItem = { title: string; url: string };
export type Track = {
  key: string;
  name: string;
  blurb: string;
  type: "PROBLEMS" | "VIDEO";
  items: TrackItem[];
};

type P = { t: string; s: string; b?: 1 };
const lc = (p: P): TrackItem => ({ title: p.t, url: `https://leetcode.com/problems/${p.s}/` });

// NeetCode 150 — in study order. `b` flags the Blind 75 subset.
const NEET: P[] = [
  // Arrays & Hashing
  { t: "Contains Duplicate", s: "contains-duplicate", b: 1 },
  { t: "Valid Anagram", s: "valid-anagram", b: 1 },
  { t: "Two Sum", s: "two-sum", b: 1 },
  { t: "Group Anagrams", s: "group-anagrams", b: 1 },
  { t: "Top K Frequent Elements", s: "top-k-frequent-elements", b: 1 },
  { t: "Product of Array Except Self", s: "product-of-array-except-self", b: 1 },
  { t: "Valid Sudoku", s: "valid-sudoku" },
  { t: "Encode and Decode Strings", s: "encode-and-decode-strings", b: 1 },
  { t: "Longest Consecutive Sequence", s: "longest-consecutive-sequence", b: 1 },
  // Two Pointers
  { t: "Valid Palindrome", s: "valid-palindrome", b: 1 },
  { t: "Two Sum II", s: "two-sum-ii-input-array-is-sorted" },
  { t: "3Sum", s: "3sum", b: 1 },
  { t: "Container With Most Water", s: "container-with-most-water", b: 1 },
  { t: "Trapping Rain Water", s: "trapping-rain-water" },
  // Sliding Window
  { t: "Best Time to Buy and Sell Stock", s: "best-time-to-buy-and-sell-stock", b: 1 },
  { t: "Longest Substring Without Repeating Characters", s: "longest-substring-without-repeating-characters", b: 1 },
  { t: "Longest Repeating Character Replacement", s: "longest-repeating-character-replacement", b: 1 },
  { t: "Permutation in String", s: "permutation-in-string" },
  { t: "Minimum Window Substring", s: "minimum-window-substring", b: 1 },
  { t: "Sliding Window Maximum", s: "sliding-window-maximum" },
  // Stack
  { t: "Valid Parentheses", s: "valid-parentheses", b: 1 },
  { t: "Min Stack", s: "min-stack" },
  { t: "Evaluate Reverse Polish Notation", s: "evaluate-reverse-polish-notation" },
  { t: "Generate Parentheses", s: "generate-parentheses" },
  { t: "Daily Temperatures", s: "daily-temperatures" },
  { t: "Car Fleet", s: "car-fleet" },
  { t: "Largest Rectangle in Histogram", s: "largest-rectangle-in-histogram" },
  // Binary Search
  { t: "Binary Search", s: "binary-search" },
  { t: "Search a 2D Matrix", s: "search-a-2d-matrix" },
  { t: "Koko Eating Bananas", s: "koko-eating-bananas" },
  { t: "Find Minimum in Rotated Sorted Array", s: "find-minimum-in-rotated-sorted-array", b: 1 },
  { t: "Search in Rotated Sorted Array", s: "search-in-rotated-sorted-array", b: 1 },
  { t: "Time Based Key-Value Store", s: "time-based-key-value-store" },
  { t: "Median of Two Sorted Arrays", s: "median-of-two-sorted-arrays" },
  // Linked List
  { t: "Reverse Linked List", s: "reverse-linked-list", b: 1 },
  { t: "Merge Two Sorted Lists", s: "merge-two-sorted-lists", b: 1 },
  { t: "Reorder List", s: "reorder-list", b: 1 },
  { t: "Remove Nth Node From End of List", s: "remove-nth-node-from-end-of-list", b: 1 },
  { t: "Copy List With Random Pointer", s: "copy-list-with-random-pointer" },
  { t: "Add Two Numbers", s: "add-two-numbers" },
  { t: "Linked List Cycle", s: "linked-list-cycle", b: 1 },
  { t: "Find the Duplicate Number", s: "find-the-duplicate-number" },
  { t: "LRU Cache", s: "lru-cache" },
  { t: "Merge k Sorted Lists", s: "merge-k-sorted-lists", b: 1 },
  { t: "Reverse Nodes in k-Group", s: "reverse-nodes-in-k-group" },
  // Trees
  { t: "Invert Binary Tree", s: "invert-binary-tree", b: 1 },
  { t: "Maximum Depth of Binary Tree", s: "maximum-depth-of-binary-tree", b: 1 },
  { t: "Diameter of Binary Tree", s: "diameter-of-binary-tree" },
  { t: "Balanced Binary Tree", s: "balanced-binary-tree" },
  { t: "Same Tree", s: "same-tree", b: 1 },
  { t: "Subtree of Another Tree", s: "subtree-of-another-tree", b: 1 },
  { t: "Lowest Common Ancestor of a BST", s: "lowest-common-ancestor-of-a-binary-search-tree", b: 1 },
  { t: "Binary Tree Level Order Traversal", s: "binary-tree-level-order-traversal", b: 1 },
  { t: "Binary Tree Right Side View", s: "binary-tree-right-side-view" },
  { t: "Count Good Nodes in Binary Tree", s: "count-good-nodes-in-binary-tree" },
  { t: "Validate Binary Search Tree", s: "validate-binary-search-tree", b: 1 },
  { t: "Kth Smallest Element in a BST", s: "kth-smallest-element-in-a-bst", b: 1 },
  { t: "Construct Binary Tree from Preorder and Inorder Traversal", s: "construct-binary-tree-from-preorder-and-inorder-traversal", b: 1 },
  { t: "Binary Tree Maximum Path Sum", s: "binary-tree-maximum-path-sum", b: 1 },
  { t: "Serialize and Deserialize Binary Tree", s: "serialize-and-deserialize-binary-tree", b: 1 },
  // Tries
  { t: "Implement Trie (Prefix Tree)", s: "implement-trie-prefix-tree", b: 1 },
  { t: "Design Add and Search Words Data Structure", s: "design-add-and-search-words-data-structure", b: 1 },
  { t: "Word Search II", s: "word-search-ii", b: 1 },
  // Heap / Priority Queue
  { t: "Kth Largest Element in a Stream", s: "kth-largest-element-in-a-stream" },
  { t: "Last Stone Weight", s: "last-stone-weight" },
  { t: "K Closest Points to Origin", s: "k-closest-points-to-origin" },
  { t: "Kth Largest Element in an Array", s: "kth-largest-element-in-an-array" },
  { t: "Task Scheduler", s: "task-scheduler" },
  { t: "Design Twitter", s: "design-twitter" },
  { t: "Find Median from Data Stream", s: "find-median-from-data-stream", b: 1 },
  // Backtracking
  { t: "Subsets", s: "subsets" },
  { t: "Combination Sum", s: "combination-sum", b: 1 },
  { t: "Permutations", s: "permutations" },
  { t: "Subsets II", s: "subsets-ii" },
  { t: "Combination Sum II", s: "combination-sum-ii" },
  { t: "Word Search", s: "word-search", b: 1 },
  { t: "Palindrome Partitioning", s: "palindrome-partitioning" },
  { t: "Letter Combinations of a Phone Number", s: "letter-combinations-of-a-phone-number" },
  { t: "N-Queens", s: "n-queens" },
  // Graphs
  { t: "Number of Islands", s: "number-of-islands", b: 1 },
  { t: "Max Area of Island", s: "max-area-of-island" },
  { t: "Clone Graph", s: "clone-graph", b: 1 },
  { t: "Walls and Gates", s: "walls-and-gates" },
  { t: "Rotting Oranges", s: "rotting-oranges" },
  { t: "Pacific Atlantic Water Flow", s: "pacific-atlantic-water-flow", b: 1 },
  { t: "Surrounded Regions", s: "surrounded-regions" },
  { t: "Course Schedule", s: "course-schedule", b: 1 },
  { t: "Course Schedule II", s: "course-schedule-ii" },
  { t: "Graph Valid Tree", s: "graph-valid-tree", b: 1 },
  { t: "Number of Connected Components in an Undirected Graph", s: "number-of-connected-components-in-an-undirected-graph", b: 1 },
  { t: "Redundant Connection", s: "redundant-connection" },
  { t: "Word Ladder", s: "word-ladder" },
  // Advanced Graphs
  { t: "Reconstruct Itinerary", s: "reconstruct-itinerary" },
  { t: "Min Cost to Connect All Points", s: "min-cost-to-connect-all-points" },
  { t: "Network Delay Time", s: "network-delay-time" },
  { t: "Swim in Rising Water", s: "swim-in-rising-water" },
  { t: "Alien Dictionary", s: "alien-dictionary" },
  { t: "Cheapest Flights Within K Stops", s: "cheapest-flights-within-k-stops" },
  // 1-D DP
  { t: "Climbing Stairs", s: "climbing-stairs", b: 1 },
  { t: "Min Cost Climbing Stairs", s: "min-cost-climbing-stairs" },
  { t: "House Robber", s: "house-robber", b: 1 },
  { t: "House Robber II", s: "house-robber-ii", b: 1 },
  { t: "Longest Palindromic Substring", s: "longest-palindromic-substring", b: 1 },
  { t: "Palindromic Substrings", s: "palindromic-substrings", b: 1 },
  { t: "Decode Ways", s: "decode-ways", b: 1 },
  { t: "Coin Change", s: "coin-change", b: 1 },
  { t: "Maximum Product Subarray", s: "maximum-product-subarray", b: 1 },
  { t: "Word Break", s: "word-break", b: 1 },
  { t: "Longest Increasing Subsequence", s: "longest-increasing-subsequence", b: 1 },
  { t: "Partition Equal Subset Sum", s: "partition-equal-subset-sum" },
  // 2-D DP
  { t: "Unique Paths", s: "unique-paths", b: 1 },
  { t: "Longest Common Subsequence", s: "longest-common-subsequence", b: 1 },
  { t: "Best Time to Buy and Sell Stock with Cooldown", s: "best-time-to-buy-and-sell-stock-with-cooldown" },
  { t: "Coin Change II", s: "coin-change-ii" },
  { t: "Target Sum", s: "target-sum" },
  { t: "Interleaving String", s: "interleaving-string" },
  { t: "Longest Increasing Path in a Matrix", s: "longest-increasing-path-in-a-matrix" },
  { t: "Distinct Subsequences", s: "distinct-subsequences" },
  { t: "Edit Distance", s: "edit-distance" },
  { t: "Burst Balloons", s: "burst-balloons" },
  { t: "Regular Expression Matching", s: "regular-expression-matching" },
  // Greedy
  { t: "Maximum Subarray", s: "maximum-subarray", b: 1 },
  { t: "Jump Game", s: "jump-game", b: 1 },
  { t: "Jump Game II", s: "jump-game-ii" },
  { t: "Gas Station", s: "gas-station" },
  { t: "Hand of Straights", s: "hand-of-straights" },
  { t: "Merge Triplets to Form Target Triplet", s: "merge-triplets-to-form-target-triplet" },
  { t: "Partition Labels", s: "partition-labels" },
  { t: "Valid Parenthesis String", s: "valid-parenthesis-string" },
  // Intervals
  { t: "Insert Interval", s: "insert-interval", b: 1 },
  { t: "Merge Intervals", s: "merge-intervals", b: 1 },
  { t: "Non-overlapping Intervals", s: "non-overlapping-intervals", b: 1 },
  { t: "Meeting Rooms", s: "meeting-rooms", b: 1 },
  { t: "Meeting Rooms II", s: "meeting-rooms-ii", b: 1 },
  { t: "Minimum Interval to Include Each Query", s: "minimum-interval-to-include-each-query" },
  // Math & Geometry
  { t: "Rotate Image", s: "rotate-image" },
  { t: "Spiral Matrix", s: "spiral-matrix" },
  { t: "Set Matrix Zeroes", s: "set-matrix-zeroes" },
  { t: "Happy Number", s: "happy-number" },
  { t: "Plus One", s: "plus-one" },
  { t: "Pow(x, n)", s: "powx-n" },
  { t: "Multiply Strings", s: "multiply-strings" },
  { t: "Detect Squares", s: "detect-squares" },
  // Bit Manipulation
  { t: "Single Number", s: "single-number" },
  { t: "Number of 1 Bits", s: "number-of-1-bits" },
  { t: "Counting Bits", s: "counting-bits" },
  { t: "Reverse Bits", s: "reverse-bits" },
  { t: "Missing Number", s: "missing-number" },
  { t: "Sum of Two Integers", s: "sum-of-two-integers" },
  { t: "Reverse Integer", s: "reverse-integer" },
];

// Striver A2Z DSA Course — steps link to the relevant section of the sheet.
const STRIVER_SHEET = "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2";
const STRIVER_STEPS = [
  "Step 1 — Learn the Basics",
  "Step 2 — Sorting Techniques",
  "Step 3 — Arrays",
  "Step 4 — Binary Search",
  "Step 5 — Strings (Basic & Medium)",
  "Step 6 — Linked List",
  "Step 7 — Recursion",
  "Step 8 — Bit Manipulation",
  "Step 9 — Stack & Queues",
  "Step 10 — Sliding Window & Two Pointer",
  "Step 11 — Heaps",
  "Step 12 — Greedy Algorithms",
  "Step 13 — Binary Trees",
  "Step 14 — Binary Search Trees",
  "Step 15 — Graphs",
  "Step 16 — Dynamic Programming",
  "Step 17 — Tries",
  "Step 18 — Strings (Hard)",
];

export const TRACKS: Track[] = [
  {
    key: "blind75",
    name: "Blind 75",
    blurb: "The 75 essential interview problems. Best starting point.",
    type: "PROBLEMS",
    items: NEET.filter((p) => p.b).map(lc),
  },
  {
    key: "neetcode150",
    name: "NeetCode 150",
    blurb: "150 problems covering every core pattern. Superset of Blind 75.",
    type: "PROBLEMS",
    items: NEET.map(lc),
  },
  {
    key: "striver-a2z",
    name: "Striver A2Z DSA",
    blurb: "Striver's 18-step A2Z course. Each step links to the sheet section.",
    type: "VIDEO",
    items: STRIVER_STEPS.map((t) => ({ title: t, url: STRIVER_SHEET })),
  },
];

export const TRACK_SUMMARY = TRACKS.map((t) => ({
  key: t.key,
  name: t.name,
  blurb: t.blurb,
  type: t.type,
  count: t.items.length,
}));

export function getTrack(key: string): Track | undefined {
  return TRACKS.find((t) => t.key === key);
}
