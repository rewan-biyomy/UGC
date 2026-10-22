export interface CreatorProfile {
  avatarUrl: string | null;
  bio: string;
}

const PROFILE_KEY_PREFIX = "ugc.creator-profile.";

export class CreatorProfileService {
  private static instance: CreatorProfileService;
  private constructor() {}

  static getInstance(): CreatorProfileService {
    return (CreatorProfileService.instance ??= new CreatorProfileService());
  }

  get(creatorId: string): CreatorProfile | null {
    const saved = localStorage.getItem(`${PROFILE_KEY_PREFIX}${creatorId}`);
    if (!saved) return null;
    try {
      const value: unknown = JSON.parse(saved);
      if (!value || typeof value !== "object") throw new Error("Invalid creator profile");
      const profile = value as Partial<CreatorProfile>;
      if ((profile.avatarUrl !== null && typeof profile.avatarUrl !== "string") || typeof profile.bio !== "string") {
        throw new Error("Invalid creator profile");
      }
      return { avatarUrl: profile.avatarUrl ?? null, bio: profile.bio };
    } catch (error) {
      console.error(`Unable to read creator profile ${creatorId}`, error);
      throw error;
    }
  }

  save(creatorId: string, profile: CreatorProfile): void {
    if (!creatorId.trim()) throw new Error("A creator is required to save a profile.");
    localStorage.setItem(`${PROFILE_KEY_PREFIX}${creatorId}`, JSON.stringify(profile));
  }
}
