import type {
  SessionRequest,
  UpdateUserProfilePayload,
  UserProfile,
} from "./contracts";

export function getUserProfile(
  request: SessionRequest,
  usersMeUrl: string,
): Promise<UserProfile> {
  return request<UserProfile>(usersMeUrl);
}

export function updateUserProfile(
  request: SessionRequest,
  usersMeUrl: string,
  payload: UpdateUserProfilePayload,
): Promise<UserProfile> {
  return request<UserProfile>(usersMeUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(normalizeUserProfilePayload(payload)),
  });
}

export function normalizeUserProfilePayload(
  payload: UpdateUserProfilePayload,
): UpdateUserProfilePayload {
  return {
    username: payload.username?.trim(),
    display_name: payload.display_name?.trim(),
    bio: payload.bio?.trim(),
    avatar_url: payload.avatar_url?.trim(),
  };
}
