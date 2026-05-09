export type UserRole = "user" | "owner" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserProfilePayload {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  avatar_file?: File;
}

export type SessionRequest = <T>(
  url: string,
  options?: RequestInit,
) => Promise<T>;
