// src/core/storage/DriveUploadStrategy.ts
import type { UploadProgress, UploadResult, UploadStrategy } from "./UploadStrategy";

/**
 * Uploads directly to Drive with the user's short-lived OAuth access token.
 * Resumable uploads support the large video files accepted by the uploader.
 */
export class DriveUploadStrategy implements UploadStrategy {
  readonly name = "google-drive";

  async upload(file: File, accessToken: string, onProgress: (p: UploadProgress) => void): Promise<UploadResult> {
    const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) throw new Error("VITE_GOOGLE_DRIVE_FOLDER_ID is not configured");

    const metadata = JSON.stringify({
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      parents: [folderId],
    });
    const session = await this.createResumableSession(file, metadata, accessToken);
    const uploaded = await this.sendFile(session, file, accessToken, onProgress);

    if (!uploaded.id) throw new Error("Google Drive لم يُرجع معرّف الملف.");
    return {
      fileId: uploaded.id,
      webViewLink: uploaded.webViewLink ?? `https://drive.google.com/file/d/${uploaded.id}/view`,
      thumbnailUrl: uploaded.thumbnailLink ?? null,
    };
  }

  private createResumableSession(file: File, metadata: string, accessToken: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open(
        "POST",
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink,thumbnailLink",
      );
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      request.setRequestHeader("X-Upload-Content-Type", file.type || "application/octet-stream");
      request.setRequestHeader("X-Upload-Content-Length", String(file.size));
      request.onload = () => {
        const location = request.getResponseHeader("Location");
        if (request.status >= 200 && request.status < 300 && location) {
          resolve(location);
        } else {
          reject(new Error(this.googleErrorMessage(request.responseText, request.status)));
        }
      };
      request.onerror = () => reject(new Error("تعذّر الاتصال بـ Google Drive. تحقق من الإنترنت وإعدادات Google Cloud."));
      request.send(metadata);
    });
  }

  private sendFile(
    sessionUrl: string,
    file: File,
    accessToken: string,
    onProgress: (p: UploadProgress) => void,
  ): Promise<{ id?: string; webViewLink?: string; thumbnailLink?: string }> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", sessionUrl);
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      request.upload.onprogress = (event) =>
        onProgress({ loaded: event.loaded, total: event.total || file.size });
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          try {
            resolve(JSON.parse(request.responseText) as { id?: string; webViewLink?: string; thumbnailLink?: string });
          } catch {
            reject(new Error("استجابة Google Drive غير صالحة."));
          }
        } else {
          reject(new Error(this.googleErrorMessage(request.responseText, request.status)));
        }
      };
      request.onerror = () => reject(new Error("انقطع الاتصال أثناء رفع الملف إلى Google Drive."));
      request.send(file);
    });
  }

  private googleErrorMessage(responseText: string, status: number): string {
    try {
      const response = JSON.parse(responseText) as { error?: { message?: string } };
      if (response.error?.message) return `رفض Google Drive الرفع (${status}): ${response.error.message}`;
    } catch {
      // Use the HTTP status when Drive does not return a JSON error.
    }
    return `فشل رفع الملف إلى Google Drive (HTTP ${status}).`;
  }
}