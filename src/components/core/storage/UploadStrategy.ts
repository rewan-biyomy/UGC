// src/core/storage/UploadStrategy.ts
export interface UploadProgress { loaded: number; total: number; }
export interface UploadResult { fileId: string; webViewLink: string; thumbnailUrl: string | null; }

/** Interface Segregation: uploader depends only on this contract. */
export interface UploadStrategy {
  readonly name: string;
  upload(file: File, accessToken: string, onProgress: (p: UploadProgress) => void): Promise<UploadResult>;
}