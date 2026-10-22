// src/core/storage/UploadManager.ts
import { DriveUploadStrategy } from "./DriveUploadStrategy";
import type { UploadStrategy } from "./UploadStrategy";

/** Factory + registry: swap storage providers without changing features. */
export class UploadManager {
  private constructor(private readonly strategies: Map<string, UploadStrategy>) {}

  static default(): UploadManager {
    return new UploadManager(new Map([["google-drive", new DriveUploadStrategy()]]));
  }

  strategy(name = "google-drive"): UploadStrategy {
    const s = this.strategies.get(name);
    if (!s) throw new Error(`UploadStrategy '${name}' is not registered`);
    return s;
  }
}