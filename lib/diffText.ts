// lib/diffText.ts
// ---------------------------------------------------
// Word-level diff (no dependencies) for resume rewrites
// Produces an array like:
//   { type: "same" | "added" | "removed" | "modified", text: string }
// ---------------------------------------------------

export function diffText(oldText: string, newText: string) {
  const oldWords = tokenizeWords(oldText);
  const newWords = tokenizeWords(newText);

  // If identical → return "same"
  if (oldText.trim() === newText.trim()) {
    return [{ type: "same", text: newText }];
  }

  const dp: number[][] = Array(oldWords.length + 1)
    .fill(0)
    .map(() => Array(newWords.length + 1).fill(0));

  // Build LCS table
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to determine diff
  let i = oldWords.length;
  let j = newWords.length;

  const out: { type: string; text: string }[] = [];

  while (i > 0 && j > 0) {
    if (oldWords[i - 1] === newWords[j - 1]) {
      out.unshift({ type: "same", text: oldWords[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      // Removed
      out.unshift({ type: "removed", text: oldWords[i - 1] });
      i--;
    } else {
      // Added
      out.unshift({ type: "added", text: newWords[j - 1] });
      j--;
    }
  }

  // Remaining removals
  while (i > 0) {
    out.unshift({ type: "removed", text: oldWords[i - 1] });
    i--;
  }

  // Remaining additions
  while (j > 0) {
    out.unshift({ type: "added", text: newWords[j - 1] });
    j--;
  }

  // Merge removed+added into "modified"
  return mergeModified(out);
}

/* -----------------------------
   Tokenizer (splits into words)
------------------------------ */
function tokenizeWords(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

/* -----------------------------
   If removed + added occur consecutively
   → turn into "modified"
------------------------------ */
function mergeModified(list: { type: string; text: string }[]) {
  const out: { type: string; text: string }[] = [];

  let i = 0;
  while (i < list.length) {
    const curr = list[i];
    const next = list[i + 1];

    if (curr?.type === "removed" && next?.type === "added") {
      out.push({
        type: "modified",
        text: next.text,
      });
      i += 2;
      continue;
    }

    out.push(curr);
    i++;
  }

  return out;
}
