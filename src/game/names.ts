/** Choose the shortest unambiguous suffix of each student's full name. */
export function createDisplayNames(
  fullNames: readonly string[],
): Record<string, string> {
  const displayNames = new Map<string, string>();
  const wordsByName = new Map(
    fullNames.map((name) => [name, name.trim().split(/\s+/).filter(Boolean)]),
  );
  const maximumWords = Math.max(
    0,
    ...Array.from(wordsByName.values(), (words) => words.length),
  );
  const suffix = (name: string, wordCount: number) =>
    (wordsByName.get(name) ?? []).slice(-wordCount).join(" ");
  for (let wordCount = 1; wordCount < maximumWords; wordCount++) {
    const occurrences = new Map<string, number>();
    for (const name of fullNames) {
      if (displayNames.has(name)) continue;
      const candidate = suffix(name, wordCount);
      occurrences.set(candidate, (occurrences.get(candidate) ?? 0) + 1);
    }
    const usedNames = new Set(displayNames.values());
    for (const name of fullNames) {
      const candidate = suffix(name, wordCount);
      if (
        !displayNames.has(name) &&
        occurrences.get(candidate) === 1 &&
        !usedNames.has(candidate)
      )
        displayNames.set(name, candidate);
    }
  }
  return Object.fromEntries(
    fullNames.map((name) => [name, displayNames.get(name) ?? name.trim()]),
  );
}
