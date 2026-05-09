import { describe, expect, it, vi } from "vitest";

import {
  getHomepageDiscovery,
  normalizeHomepageDiscovery,
} from "./homepage-discovery";

describe("homepage discovery", () => {
  it("normalizes missing homepage sections to empty arrays", () => {
    expect(normalizeHomepageDiscovery(null)).toEqual({
      top_rated: [],
      newest: [],
    });
  });

  it("loads separated top-rated and newest sections", async () => {
    const request = vi.fn(async () => ({
      top_rated: [{ slug: "top-rated" }],
      newest: [{ slug: "newest" }],
    }));

    await expect(getHomepageDiscovery(request, "/api/v1/restaurants/homepage/")).resolves.toEqual({
      top_rated: [{ slug: "top-rated" }],
      newest: [{ slug: "newest" }],
    });
    expect(request).toHaveBeenCalledWith("/api/v1/restaurants/homepage/");
  });
});
