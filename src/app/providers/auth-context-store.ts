import { createContext } from "react";
import type { Role } from "@/components/core/constants/roles";
import type { User } from "@/components/core/models/User";
import type { OnboardingPayload, RegistrationPayload } from "@/components/core/services/AuthService";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isDemoAuthEnabled: boolean;
  isDemoSession: boolean;
  signInWithGoogle: (credential: string, requestedRole?: RegistrationPayload["role"]) => Promise<User>;
  signInWithAdminGoogle: (credential: string) => Promise<void>;
  registerWithEmail: (payload: RegistrationPayload) => Promise<void>;
  signInWithDemo: (role: Role) => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  updateCreatorProfile: (profile: { avatarUrl: string | null; bio: string }) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
