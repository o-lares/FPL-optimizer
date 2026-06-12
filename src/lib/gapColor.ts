const GREEN_HUE = 145;
const WARNING_HUE = 15;

export function gapColor(gap: number, maxGap: number): string {
  if (gap <= 0) {
    return "var(--gap-good)";
  }

  const scale = Math.min(gap / Math.max(maxGap, 1), 1);
  const hue = GREEN_HUE + (WARNING_HUE - GREEN_HUE) * scale;
  const lightness = 34 + 12 * scale;

  return `hsl(${Math.round(hue)} 76% ${Math.round(lightness)}%)`;
}
