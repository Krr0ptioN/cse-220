"use client";

import * as React from "react";
import { RiUploadCloud2Line } from "@remixicon/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Label,
  Separator,
  Skeleton,
  Textarea,
  cn,
} from "ui-common";

import type { UpdateUserProfilePayload, UserProfile } from "../api";
import { useFileUpload } from "./use-file-upload";

export interface UserProfileEditorProps {
  profile?: UserProfile | null;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  onSubmit: (payload: UpdateUserProfilePayload) => void;
  className?: string;
}

export function UserProfileEditor({
  profile,
  isLoading,
  isSaving,
  error,
  onSubmit,
  className,
}: UserProfileEditorProps) {
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | undefined>();
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [{ files, isDragging, errors }, fileUpload] = useFileUpload({
    accept: "image/jpeg,image/png,image/webp",
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
    onFilesAdded: (addedFiles) => {
      const addedFile = addedFiles[0]?.file;

      if (!(addedFile instanceof File)) {
        return;
      }

      setAvatarFile(addedFile);

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setUploadError(null);
        }
      };
      reader.onerror = () => {
        setUploadError("We could not read that image. Try another file.");
      };
      reader.readAsDataURL(addedFile);
    },
  });

  React.useEffect(() => {
    setUsername(profile?.username ?? "");
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
    setAvatarFile(undefined);
  }, [profile]);

  if (isLoading) {
    return <UserProfileEditorSkeleton className={className} />;
  }

  const initials = getInitials(displayName || username || profile?.email);
  const avatarPreview = files[0]?.preview || avatarUrl.trim() || undefined;
  const hasChanges =
    username.trim() !== (profile?.username ?? "") ||
    displayName.trim() !== (profile?.display_name ?? "") ||
    bio.trim() !== (profile?.bio ?? "") ||
    avatarUrl.trim() !== (profile?.avatar_url ?? "") ||
    avatarFile !== undefined;

  return (
    <form
      className={cn("space-y-0 rounded-xl border bg-card", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          username,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          avatar_file: avatarFile,
        });
      }}
    >
      <ProfileSection
        title="Public profile"
        description="This information appears on your reviews and saved restaurant activity."
      >
        <div
          className={cn(
            "flex flex-col gap-4 rounded-lg border border-dashed border-border/80 p-4 transition sm:flex-row sm:items-center",
            isDragging && "border-primary bg-primary/5",
          )}
          onDragEnter={fileUpload.handleDragEnter}
          onDragLeave={fileUpload.handleDragLeave}
          onDragOver={fileUpload.handleDragOver}
          onDrop={fileUpload.handleDrop}
        >
          <Avatar className="h-20 w-20 border">
            <AvatarImage
              src={avatarPreview}
              alt={displayName || username || "User avatar"}
            />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="grid flex-1 gap-3">
            <input
              {...fileUpload.getInputProps({
                id: "profile_picture",
                "aria-label": "Profile picture",
                className: "sr-only",
              })}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={fileUpload.openFileDialog}
              >
                <RiUploadCloud2Line className="size-4" aria-hidden="true" />
                Upload picture
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP. Max 2 MB.
              </p>
            </div>
            {(errors[0] || uploadError) && (
              <p className="text-sm text-destructive">{errors[0] || uploadError}</p>
            )}
            <Input
              id="avatar_url"
              type="url"
              value={avatarUrl}
              placeholder="https://example.com/avatar.png"
              className="hidden"
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </div>
        </div>
      </ProfileSection>

      <Separator />

      <ProfileSection
        title="Account identity"
        description="Use a recognizable name so restaurants and reviewers can identify you."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              value={displayName}
              maxLength={100}
              placeholder="Your display name"
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              maxLength={50}
              placeholder="username"
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
        </div>
      </ProfileSection>

      <Separator />

      <ProfileSection
        title="Bio"
        description="Share what kind of restaurants and dining experiences you care about."
      >
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            rows={5}
            maxLength={500}
            placeholder="Neighborhoods, cuisines, dietary preferences, or review style."
            onChange={(event) => setBio(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{bio.length}/500</p>
        </div>
      </ProfileSection>

      <Separator />

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm text-destructive">{error}</p>
        <Button type="submit" disabled={isSaving || !hasChanges}>
          {isSaving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 px-5 py-6 md:grid-cols-10 md:gap-8">
      <div className="space-y-1 md:col-span-4">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="md:col-span-6">{children}</div>
    </section>
  );
}

function UserProfileEditorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-0 rounded-xl border bg-card", className)}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index}>
          <section className="grid gap-5 px-5 py-6 md:grid-cols-10 md:gap-8">
            <div className="space-y-2 md:col-span-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-3 md:col-span-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </section>
          {index < 2 ? <Separator /> : null}
        </div>
      ))}
    </div>
  );
}

function getInitials(value?: string | null): string {
  return (
    value
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "FM"
  );
}
