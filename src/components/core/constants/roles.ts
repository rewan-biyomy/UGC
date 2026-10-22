// src/core/constants/roles.ts
export const Role = { ADMIN: "ADMIN", CLIENT: "CLIENT", CREATOR: "CREATOR" } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CreatorCategory = {
  PHOTOGRAPHY_MODEL: "PHOTOGRAPHY_MODEL",
  VIDEOGRAPHER: "VIDEOGRAPHER",
  VIDEO_EDITOR: "VIDEO_EDITOR",
} as const;
export type CreatorCategory = (typeof CreatorCategory)[keyof typeof CreatorCategory];

export const CREATOR_CATEGORY_LABELS: Record<CreatorCategory, string> = {
  PHOTOGRAPHY_MODEL: "عارض/ة ومصوّر/ة",
  VIDEOGRAPHER: "تصوير الفيديو",
  VIDEO_EDITOR: "تحرير الفيديو",
};

export const VIDEO_CATEGORIES: readonly CreatorCategory[] = [
  CreatorCategory.VIDEOGRAPHER,
  CreatorCategory.VIDEO_EDITOR,
];