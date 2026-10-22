// src/core/services/AuthService.ts
import { ApiClient } from "../http/ApiClient";
import type { CreatorCategory, Role } from "../constants/roles";
import { UserFactory, type SessionDTO, type User, type UserDTO } from "../models/User";

export type OnboardingPayload =
  | { role: "CREATOR"; age: number; country: string; avatarUrl: string | null; category: CreatorCategory; nicheIds: string[]; bio: string }
  | { role: "CLIENT"; age: number; country: string; brandLogoUrl: string | null; brandName: string; industry: string };

export interface RegistrationPayload {
  role: Exclude<Role, "ADMIN">;
  name: string;
  age: number;
  country: string;
  email: string;
  password: string;
}

export class AuthService {
  private static instance: AuthService;
  private constructor(private readonly api: ApiClient) {}

  static getInstance(): AuthService {
    return (AuthService.instance ??= new AuthService(ApiClient.getInstance()));
  }

  /** Google OAuth: verifies the credential server-side, returns our JWT + profile. */
  async googleLogin(credential: string, requestedRole?: Exclude<Role, "ADMIN">): Promise<SessionDTO> {
    return this.api.post<SessionDTO>("/auth/google", { credential, ...(requestedRole ? { requestedRole } : {}) });
  }

  async adminGoogleLogin(credential: string): Promise<SessionDTO> {
    return this.api.post<SessionDTO>("/auth/admin/google", { credential });
  }

  async register(payload: RegistrationPayload): Promise<SessionDTO> {
    return this.api.post<SessionDTO>("/auth/register", payload);
  }

  async completeOnboarding(payload: OnboardingPayload): Promise<SessionDTO> {
    return this.api.post<SessionDTO>("/auth/onboarding", payload);
  }

  async updateCreatorProfile(profile: { avatarUrl: string | null; bio: string }): Promise<UserDTO> {
    return this.api.patch<UserDTO>("/creators/me/profile", profile);
  }

  toDomain(dto: UserDTO): User { return UserFactory.fromDTO(dto); }
}