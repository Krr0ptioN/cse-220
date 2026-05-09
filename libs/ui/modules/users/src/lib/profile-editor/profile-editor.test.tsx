import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserProfileEditor } from "./profile-editor";

const readAsDataURL = vi.fn();

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: Blob) {
    readAsDataURL(file);
    this.result = "data:image/png;base64,avatar-data";
    this.onload?.({} as ProgressEvent<FileReader>);
  }
}

describe("UserProfileEditor", () => {
  beforeEach(() => {
    vi.stubGlobal("FileReader", MockFileReader);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:avatar-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("submits an uploaded profile image as an avatar file", async () => {
    const onSubmit = vi.fn();

    render(
      <UserProfileEditor
        profile={{
          id: "user-1",
          email: "ada@example.com",
          username: "ada",
          display_name: "Ada Lovelace",
          bio: "Reviews bistros.",
          avatar_url: "",
          role: "user",
        }}
        onSubmit={onSubmit}
      />,
    );

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/profile picture/i), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(readAsDataURL).toHaveBeenCalledWith(file);
    });

    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_file: file,
      }),
    );
  });
});
