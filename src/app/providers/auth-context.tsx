import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { ApiClient } from "@/components/core/http/ApiClient";
import { Role } from "@/components/core/constants/roles";
import { CreatorUser, UserFactory, type SessionDTO, type User, type UserDTO } from "@/components/core/models/User";
import { AuthService, type OnboardingPayload, type RegistrationPayload } from "@/components/core/services/AuthService";
import { CreatorProfileService } from "@/components/core/services/CreatorProfileService";
import { AuthContext } from "./auth-context-store";
const STORAGE_KEY = "ugc.session";
const DEMO_SESSION_TOKEN = "ugc-demo-session";
const DEMO_PROFILE_KEY_PREFIX = "ugc.demo.profile.";
const isDemoAuthEnabled = import.meta.env.DEV;

function isSession(value: unknown): value is SessionDTO {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<SessionDTO>;
  return typeof session.token === "string"
    && !!session.user
    && typeof session.user.id === "string"
    && typeof session.user.role === "string";
}

function withDemoCreatorProfile(dto: UserDTO): UserDTO {
  if (dto.role !== Role.CREATOR) return dto;
  try {
    const saved = CreatorProfileService.getInstance().get(dto.id);
    return saved ? { ...dto, avatarUrl: saved.avatarUrl, bio: saved.bio } : dto;
  } catch (error) {
    console.error("Unable to restore saved creator profile; keeping the account session", error);
    return dto;
  }
}

function restoreDemoUser(role: Role, id: string): UserDTO | null {
  try {
    const raw = localStorage.getItem(`${DEMO_PROFILE_KEY_PREFIX}${role}`);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") throw new Error("Invalid saved demo profile");
    const profile = value as Partial<UserDTO>;
    if (profile.id !== id || profile.role !== role || typeof profile.name !== "string" || typeof profile.email !== "string") {
      throw new Error("Saved demo profile does not match this account");
    }
    return profile as UserDTO;
  } catch (error) {
    console.error(`Unable to restore demo profile for ${role}`, error);
    return null;
  }
}

interface AuthSessionState {
  user: User | null;
  isDemoSession: boolean;
}

function restoreSession(): AuthSessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, isDemoSession: false };
    const value: unknown = JSON.parse(raw);
    if (!isSession(value)) throw new Error("Invalid saved session");
    if (value.token === DEMO_SESSION_TOKEN && !isDemoAuthEnabled) {
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, isDemoSession: false };
    }
    ApiClient.getInstance().setToken(value.token);
    const isDemoSession = value.token === DEMO_SESSION_TOKEN;
    return {
      user: UserFactory.fromDTO(isDemoSession ? withDemoCreatorProfile(value.user) : value.user),
      isDemoSession,
    };
  } catch (error) {
    console.error("Unable to restore the saved session", error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (cleanupError) {
      console.error("Unable to clear the invalid saved session", cleanupError);
    }
    return { user: null, isDemoSession: false };
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSessionState>(restoreSession);
  const { user } = session;

  const persist = useCallback((nextSession: SessionDTO, isDemoSession = false) => {
    const savedSession = {
      ...nextSession,
      user: isDemoSession ? withDemoCreatorProfile(nextSession.user) : nextSession.user,
    };
    const nextUser = UserFactory.fromDTO(savedSession.user);
    ApiClient.getInstance().setToken(nextSession.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSession));
    if (isDemoSession) {
      localStorage.setItem(`${DEMO_PROFILE_KEY_PREFIX}${savedSession.user.role}`, JSON.stringify(savedSession.user));
    }
    setSession({ user: nextUser, isDemoSession });
  }, []);

  const signInWithGoogle = useCallback(async (credential: string, requestedRole?: RegistrationPayload["role"]) => {
    const nextSession = await AuthService.getInstance().googleLogin(credential, requestedRole);
    persist(nextSession);
    return UserFactory.fromDTO(nextSession.user);
  }, [persist]);

  const signInWithAdminGoogle = useCallback(async (credential: string) => {
    const nextSession = await AuthService.getInstance().adminGoogleLogin(credential);
    if (nextSession.user.role !== Role.ADMIN) {
      throw new Error("The admin authentication service did not authorize this account.");
    }
    persist(nextSession);
  }, [persist]);

  const registerWithEmail = useCallback(async (payload: RegistrationPayload) => {
    persist(await AuthService.getInstance().register(payload));
  }, [persist]);

  const signInWithDemo = useCallback(async (role: Role) => {
    if (!isDemoAuthEnabled) {
      throw new Error("Demo sign-in is available only when enabled in development.");
    }
    const demoUserKey = `ugc.demo.user.${role}`;
    const demoUserId = localStorage.getItem(demoUserKey) ?? crypto.randomUUID();
    localStorage.setItem(demoUserKey, demoUserId);
    const user: UserDTO = restoreDemoUser(role, demoUserId) ?? {
      id: demoUserId,
      name: role === Role.ADMIN ? "Demo Admin" : "Demo User",
      email: role === Role.ADMIN ? "admin.demo@creatorlane.local" : "demo@creatorlane.local",
      role,
    };
    persist({ token: DEMO_SESSION_TOKEN, user }, true);
  }, [persist]);

  const completeOnboarding = useCallback(async (payload: OnboardingPayload) => {
    if (isDemoAuthEnabled && session.isDemoSession && user) {
      if (payload.role !== user.role) throw new Error("The selected account role does not match this demo session.");
      const demoUser: UserDTO = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: payload.role,
        age: payload.age,
        country: payload.country,
        ...(payload.role === Role.CLIENT ? {
          brandName: payload.brandName,
          industry: payload.industry,
          brandLogoUrl: payload.brandLogoUrl,
        } : { avatarUrl: payload.avatarUrl }),
        ...(payload.role === Role.CREATOR
            ? { category: payload.category, nicheIds: payload.nicheIds, bio: payload.bio }
          : {}),
      };
      persist({ token: DEMO_SESSION_TOKEN, user: demoUser }, true);
      return;
    }
    if (user && payload.role !== user.role) throw new Error("The selected account role does not match the authenticated account.");
    persist(await AuthService.getInstance().completeOnboarding(payload));
  }, [persist, session.isDemoSession, user]);

  const updateCreatorProfile = useCallback(async (profile: { avatarUrl: string | null; bio: string }) => {
    if (!(user instanceof CreatorUser)) throw new Error("A creator account is required to update this profile.");
    const currentSession = localStorage.getItem(STORAGE_KEY);
    if (!currentSession) throw new Error("The active session could not be found.");
    const savedSession: SessionDTO = JSON.parse(currentSession) as SessionDTO;
    if (session.isDemoSession) {
      CreatorProfileService.getInstance().save(user.id, profile);
      persist({ ...savedSession, user: { ...savedSession.user, ...profile } }, true);
      return;
    }
    const updatedUser = await AuthService.getInstance().updateCreatorProfile(profile);
    if (updatedUser.id !== user.id || updatedUser.role !== Role.CREATOR) {
      throw new Error("The profile response does not match the active creator account.");
    }
    try {
      CreatorProfileService.getInstance().save(user.id, profile);
    } catch (error) {
      console.error("Creator profile was saved remotely, but the local portfolio cache could not be refreshed", error);
    }
    persist({ ...savedSession, user: updatedUser });
  }, [persist, session.isDemoSession, user]);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    ApiClient.getInstance().setToken(null);
    setSession({ user: null, isDemoSession: false });
    toast.info("تم تسجيل الخروج");
  }, []);

  useEffect(() => {
    ApiClient.getInstance().onUnauthorized = signOut;
    return () => {
      ApiClient.getInstance().onUnauthorized = undefined;
    };
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ user, isLoading: false, isDemoAuthEnabled, isDemoSession: session.isDemoSession, signInWithGoogle, signInWithAdminGoogle, registerWithEmail, signInWithDemo, completeOnboarding, updateCreatorProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}