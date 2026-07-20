export function parseSnackOptions(value?: string | null) {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeSnackOptions(lines: string[]) {
  return lines.join("\n");
}

/** Unchecked snacks first (original order), then checked snacks at the bottom. */
export function sortSnackOptions(
  items: string[],
  eaten: ReadonlySet<string>,
) {
  const pending = items.filter((item) => !eaten.has(item));
  const done = items.filter((item) => eaten.has(item));
  return [...pending, ...done];
}
