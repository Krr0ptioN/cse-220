"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FavoriteRestaurantGallery,
  SectionGridList,
  VercelTabs,
} from "./_components";

import { API_ENDPOINTS } from "@/lib/restaurants";
import { sessionRequest } from "@flavor-map/ui-module-auth";
import { getFavoriteRestaurants } from "@flavor-map/ui-module-restaurants";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  UserProfileEditor,
  type UpdateUserProfilePayload,
} from "@flavor-map/ui-module-users";

type ProfileTab = "personal" | "favorites";

export default function ProfileView() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<ProfileTab>("personal");

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getUserProfile(sessionRequest, API_ENDPOINTS.users.me()),
  });

  const favoritesQuery = useQuery({
    queryKey: [
      "favorite-restaurants",
      {
        with: "categories,opening_hours",
        page_size: 12,
      },
    ],
    queryFn: () =>
      getFavoriteRestaurants({
        with: "categories,opening_hours",
        page_size: 12,
      }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateUserProfilePayload) => {
      const { avatar_file: avatarFile, ...profilePayload } = payload;
      const updatedProfile = await updateUserProfile(
        sessionRequest,
        API_ENDPOINTS.users.me(),
        profilePayload,
      );

      if (!avatarFile) {
        return updatedProfile;
      }

      return uploadUserAvatar(
        sessionRequest,
        API_ENDPOINTS.users.avatar(),
        avatarFile,
      );
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      window.dispatchEvent(
        new CustomEvent("flavormap:profile-updated", {
          detail: updatedProfile,
        }),
      );
    },
  });

  return (
    <section className="relative min-h-screen w-full px-4 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="text-muted-foreground text-base">
            Manage your account and personal information.
          </p>
        </div>

        <VercelTabs
          value={activeTab}
          onValueChange={setActiveTab}
          tabs={[
            {
              value: "personal",
              label: "Personal Info",
            },
            {
              value: "favorites",
              label: "Favorite Restaurants",
              count: favoritesQuery.data?.length,
            },
          ]}
        />

        {activeTab === "personal" && (
          <UserProfileEditor
            profile={profileQuery.data}
            isLoading={profileQuery.isLoading}
            isSaving={updateProfileMutation.isPending}
            error={
              profileQuery.error?.message ??
              updateProfileMutation.error?.message ??
              null
            }
            onSubmit={(payload) => updateProfileMutation.mutate(payload)}
          />
        )}

        {activeTab === "favorites" && (
          <SectionGridList
            title="Your Favorite Restaurants"
            description="Your saved restaurants are used for personalized recommendations."
          >
            <span className="sr-only">Favorite restaurants</span>

            <FavoriteRestaurantGallery
              restaurants={favoritesQuery.data ?? []}
              isLoading={favoritesQuery.isLoading}
            />
          </SectionGridList>
        )}
      </div>
    </section>
  );
}
