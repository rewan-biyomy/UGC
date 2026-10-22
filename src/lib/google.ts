const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/$/, "");

export function driveStreamUrl(fileId: string): string {
  return `${apiBase}/drive/${encodeURIComponent(fileId)}/stream`;
}

export function driveThumbnailUrl(fileId: string): string {
  return `${apiBase}/drive/${encodeURIComponent(fileId)}/thumbnail`;
}