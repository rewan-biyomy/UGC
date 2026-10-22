// src/core/models/PortfolioItem.ts
export type MediaType = "IMAGE" | "VIDEO_9_16";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreatorSnapshotDTO {
  id: string; name: string; avatarUrl?: string | null;
  bio?: string | null; category: string; rating: number; nicheIds: string[];
}
export interface CreatorSnapshot {
  id: string; name: string; avatarUrl: string | null;
  bio: string | null; category: string; rating: number; nicheIds: readonly string[];
}

export interface PortfolioItemDTO {
  id: string;
  creatorId: string;
  creator: CreatorSnapshotDTO;
  type: MediaType;
  status: ModerationStatus;
  nicheId: string;
  driveFileId: string;
  thumbnailUrl: string | null;
  webViewLink?: string | null;
  createdAt: string;
}

/** Immutable entity — moderation transitions return NEW instances (no setters). */
export class PortfolioItem {
  private constructor(
    public readonly id: string,
    public readonly creatorId: string,
    public readonly creator: CreatorSnapshot,
    public readonly type: MediaType,
    public readonly status: ModerationStatus,
    public readonly nicheId: string,
    public readonly driveFileId: string,
    public readonly thumbnailUrl: string | null,
    public readonly webViewLink: string | null,
    public readonly createdAt: Date,
  ) {}

  static fromDTO(dto: PortfolioItemDTO): PortfolioItem {
    return new PortfolioItem(
      dto.id, dto.creatorId,
      { ...dto.creator, avatarUrl: dto.creator.avatarUrl ?? null, bio: dto.creator.bio ?? null },
      dto.type, dto.status, dto.nicheId, dto.driveFileId,
      dto.thumbnailUrl, dto.webViewLink ?? null, new Date(dto.createdAt),
    );
  }

  get isVisibleToClients(): boolean { return this.status === "APPROVED"; }
  get isVerticalVideo(): boolean { return this.type === "VIDEO_9_16"; }

  approve(): PortfolioItem { return this.transition("APPROVED"); }
  reject(): PortfolioItem  { return this.transition("REJECTED"); }

  private transition(status: ModerationStatus): PortfolioItem {
    if (this.status !== "PENDING") throw new Error(`Cannot transition from ${this.status}`);
    return new PortfolioItem(this.id, this.creatorId, this.creator, this.type, status,
      this.nicheId, this.driveFileId, this.thumbnailUrl, this.webViewLink, this.createdAt);
  }
}