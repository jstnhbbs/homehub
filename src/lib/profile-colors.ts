export const PROFILE_COLORS = [
  { value: "#d87861", label: "Coral" },
  { value: "#6689a3", label: "Blue" },
  { value: "#4f7c6d", label: "Sage" },
  { value: "#b07aa1", label: "Plum" },
  { value: "#d19b45", label: "Gold" },
  { value: "#5f8f8b", label: "Teal" },
  { value: "#8c7ca8", label: "Lavender" },
  { value: "#b86f4d", label: "Terracotta" },
  { value: "#7f8757", label: "Olive" },
] as const;

export function isProfileColor(value: string) {
  return PROFILE_COLORS.some((color) => color.value === value);
}
