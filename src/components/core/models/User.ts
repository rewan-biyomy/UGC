// src/core/models/User.ts
import { Role, type CreatorCategory } from "../constants/roles";

export interface SessionDTO { token: string; user: UserDTO; }

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  age?: number | null;
  country?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  brandName?: string | null;
  industry?: string | null;
  brandLogoUrl?: string | null;
  category?: CreatorCategory | null;
  rating?: number;
  nicheIds?: string[];
}

/** Liskov Substitution: every subclass is a fully-usable User. */
export abstract class User {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly role: Role;
  public readonly age: number | null;
  public readonly country: string | null;
  public readonly avatarUrl: string | null;
  public readonly bio: string | null;

  protected constructor(
    id: string,
    name: string,
    email: string,
    role: Role,
    age: number | null = null,
    country: string | null = null,
    avatarUrl: string | null = null,
    bio: string | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.age = age;
    this.country = country;
    this.avatarUrl = avatarUrl;
    this.bio = bio;
  }
  abstract dashboardPath(): string;
}

export class AdminUser extends User {
  constructor(dto: UserDTO) { super(dto.id, dto.name, dto.email, Role.ADMIN, dto.age, dto.country, dto.avatarUrl, dto.bio); }
  dashboardPath() { return "/admin"; }
}

export class ClientUser extends User {
  public readonly brandName: string | null;
  public readonly industry: string | null;
  public readonly brandLogoUrl: string | null;
  constructor(dto: UserDTO) {
    super(dto.id, dto.name, dto.email, Role.CLIENT, dto.age, dto.country, dto.avatarUrl, dto.bio);
    this.brandName = dto.brandName ?? null;
    this.industry = dto.industry ?? null;
    this.brandLogoUrl = dto.brandLogoUrl ?? null;
  }
  dashboardPath() { return "/client"; }
}

export class CreatorUser extends User {
  public readonly category: CreatorCategory | null;
  public readonly rating: number;
  public readonly nicheIds: readonly string[];
  constructor(dto: UserDTO) {
    super(dto.id, dto.name, dto.email, Role.CREATOR, dto.age, dto.country, dto.avatarUrl, dto.bio);
    this.category = dto.category ?? null;
    this.rating = dto.rating ?? 0;
    this.nicheIds = dto.nicheIds ?? [];
  }
  dashboardPath() { return "/creator"; }
}

/** Open/Closed: add a new role without touching existing classes. */
export class UserFactory {
  private static readonly registry: Record<Role, (dto: UserDTO) => User> = {
    [Role.ADMIN]:   (d) => new AdminUser(d),
    [Role.CLIENT]:  (d) => new ClientUser(d),
    [Role.CREATOR]: (d) => new CreatorUser(d),
  };

  static fromDTO(dto: UserDTO): User {
    const create = this.registry[dto.role];
    if (!create) throw new Error(`Unknown role: ${dto.role}`);
    return create(dto);
  }
}