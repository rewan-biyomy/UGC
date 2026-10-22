// src/core/services/PortfolioService.ts
import type { CreatorCategory } from "../constants/roles";
import {
  PortfolioItem, type CreatorSnapshotDTO, type MediaType, type ModerationStatus, type PortfolioItemDTO,
} from "../models/PortfolioItem";
import { UploadManager } from "../storage/UploadManager";
import { CreatorProfileService } from "./CreatorProfileService";
import { CreatorRatingService } from "./CreatorRatingService";

const LOCAL_PORTFOLIO_KEY = "ugc.portfolio.items";

function readLocalPortfolio(creatorId: string): PortfolioItemDTO[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`${LOCAL_PORTFOLIO_KEY}.${creatorId}`) ?? "[]");
    return Array.isArray(value) ? value as PortfolioItemDTO[] : [];
  } catch (error) {
    console.error("Unable to read local portfolio items", error);
    return [];
  }
}

function readAllLocalPortfolio(): PortfolioItemDTO[] {
  const items: PortfolioItemDTO[] = [];
  const prefix = `${LOCAL_PORTFOLIO_KEY}.`;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    try {
      const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(value)) items.push(...value as PortfolioItemDTO[]);
    } catch (error) {
      console.error(`Unable to read portfolio items from ${key}`, error);
    }
  }
  return items;
}

function withCurrentProfile(dto: PortfolioItemDTO): PortfolioItemDTO {
  const profile = CreatorProfileService.getInstance().get(dto.creator.id);
  const rating = CreatorRatingService.averageFor(dto.creator.id);
  return {
    ...dto,
    creator: {
      ...dto.creator,
      ...(profile ? { avatarUrl: profile.avatarUrl, bio: profile.bio } : {}),
      rating: rating || dto.creator.rating,
    },
  };
}

export interface PortfolioFilters {
  q?: string;
  niche?: string[];
  category?: CreatorCategory[];
  minRating?: number;
}

export class PortfolioService {
  private static instance: PortfolioService;
  private constructor() {}

  static getInstance(): PortfolioService {
    return (PortfolioService.instance ??= new PortfolioService());
  }

  /** Clients ONLY ever receive APPROVED items — the API enforces it too. */
  listApproved(filters: PortfolioFilters): Promise<PortfolioItem[]> {
    const query = filters.q?.trim().toLocaleLowerCase();
    const items = readAllLocalPortfolio().filter((item) => {
      if (item.status !== "APPROVED") return false;
      if (filters.niche?.length && !filters.niche.includes(item.nicheId)) return false;
      if (filters.category?.length && !filters.category.includes(item.creator.category as CreatorCategory)) return false;
      if (filters.minRating !== undefined && item.creator.rating < filters.minRating) return false;
      if (query && !`${item.creator.name} ${item.creator.category} ${item.nicheId}`.toLocaleLowerCase().includes(query)) return false;
      return true;
    });
    return Promise.resolve(items.map((item) => PortfolioItem.fromDTO(withCurrentProfile(item))));
  }

  listPending(): Promise<PortfolioItem[]> {
    return Promise.resolve(readAllLocalPortfolio()
      .filter((item) => item.status === "PENDING")
      .map((item) => PortfolioItem.fromDTO(withCurrentProfile(item))));
  }

  listMine(creatorId: string): Promise<PortfolioItem[]> {
    return Promise.resolve(readLocalPortfolio(creatorId).map((item) => PortfolioItem.fromDTO(withCurrentProfile(item))));
  }

  removeMine(creatorId: string, itemId: string): Promise<void> {
    const key = `${LOCAL_PORTFOLIO_KEY}.${creatorId}`;
    const items = readLocalPortfolio(creatorId);
    const remaining = items.filter((item) => item.id !== itemId);
    if (remaining.length === items.length) {
      return Promise.reject(new Error("لم يتم العثور على العمل المطلوب في معرضك."));
    }
    localStorage.setItem(key, JSON.stringify(remaining));
    return Promise.resolve();
  }

  async create(input: {
    file: File; nicheId: string; type: MediaType;
    accessToken: string; creator: CreatorSnapshotDTO;
    onProgress: (percent: number) => void;
  }): Promise<PortfolioItem> {
    const uploaded = await UploadManager.default().strategy().upload(input.file, input.accessToken, (p) =>
      input.onProgress(Math.round((p.loaded / Math.max(p.total, 1)) * 100)),
    );
    const dto: PortfolioItemDTO = {
      id: uploaded.fileId,
      creatorId: input.creator.id,
      creator: input.creator,
      type: input.type,
      status: "PENDING",
      nicheId: input.nicheId,
      driveFileId: uploaded.fileId,
      thumbnailUrl: uploaded.thumbnailUrl,
      webViewLink: uploaded.webViewLink,
      createdAt: new Date().toISOString(),
    };
    const creatorItems = readLocalPortfolio(input.creator.id);
    localStorage.setItem(`${LOCAL_PORTFOLIO_KEY}.${input.creator.id}`, JSON.stringify([dto, ...creatorItems]));
    return PortfolioItem.fromDTO(dto);
  }

  moderate(id: string, decision: Extract<ModerationStatus, "APPROVED" | "REJECTED">): Promise<PortfolioItem> {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(`${LOCAL_PORTFOLIO_KEY}.`)) continue;
      const creatorId = key.slice(`${LOCAL_PORTFOLIO_KEY}.`.length);
      const items = readLocalPortfolio(creatorId);
      const itemIndex = items.findIndex((item) => item.id === id);
      if (itemIndex < 0) continue;
      const updated = { ...items[itemIndex], status: decision };
      items[itemIndex] = updated;
      localStorage.setItem(key, JSON.stringify(items));
      return Promise.resolve(PortfolioItem.fromDTO(updated));
    }
    return Promise.reject(new Error("لم يتم العثور على العمل في المعرض المحلي."));
  }
}