export type ClassValue = string | false | null | undefined | 0;
export function cn(...v: ClassValue[]): string {
  return v.filter(Boolean).join(" ");
}
