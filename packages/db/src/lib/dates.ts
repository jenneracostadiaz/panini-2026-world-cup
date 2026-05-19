export function toISOString(value: string | Date): string {
  return new Date(value).toISOString();
}
