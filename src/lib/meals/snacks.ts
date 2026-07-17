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
