import { describe, expect, it, vi } from "vitest";

import { uploadUserAvatar } from "./profile";

describe("uploadUserAvatar", () => {
  it("posts the avatar file as multipart form data", async () => {
    const request = vi.fn(async () => ({
      id: "user-1",
      email: "ada@example.com",
      username: "ada",
      avatar_url: "/api/v1/files/avatar/",
      role: "user" as const,
    }));
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await uploadUserAvatar(request, "/api/v1/users/me/avatar/", file);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/users/me/avatar/",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );

    const body = request.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("avatar")).toBe(file);
  });
});
