// src/core/guards/AuthorizationGuard.ts
import { Role } from "../constants/roles";
import type { User } from "../models/User";

export type Action =
  | "portfolio:create" | "portfolio:approve" | "portfolio:reject"
  | "media:upload-image" | "media:upload-video"
  | "request:create" | "request:route" | "dashboard:admin";

const MATRIX: Record<Role, readonly Action[]> = {
  [Role.ADMIN]: [
    "portfolio:approve", "portfolio:reject", "portfolio:create",
    "media:upload-image", "media:upload-video", "request:route", "dashboard:admin",
  ],
  [Role.CLIENT]:  ["request:create"],
  [Role.CREATOR]: ["portfolio:create", "media:upload-image", "media:upload-video"],
};

/** Single Responsibility: decides access. Open/Closed: extend via register(). */
export class AuthorizationGuard {
  private static extensions = new Map<Role, readonly Action[]>();

  static register(role: Role, actions: readonly Action[]): void {
    this.extensions.set(role, [...(this.extensions.get(role) ?? []), ...actions]);
  }

  static can(user: Pick<User, "role">, action: Action): boolean {
    const granted = [...(MATRIX[user.role] ?? []), ...(this.extensions.get(user.role) ?? [])];
    return granted.includes(action);
  }

  static assert(user: Pick<User, "role">, action: Action): void {
    if (!this.can(user, action)) throw new ForbiddenError(action);
  }
}

export class ForbiddenError extends Error {
  constructor(public readonly action: Action) {
    super(`Forbidden: missing permission '${action}'`);
    this.name = "ForbiddenError";
  }
}