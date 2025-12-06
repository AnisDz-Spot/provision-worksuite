"use client";

import { UserProfileSettings } from "./UserProfileSettings";
import { UserCredentialsSettings } from "./UserCredentialsSettings";

export function UserSettingsForm() {
  return (
    <>
      <UserProfileSettings />
      <UserCredentialsSettings />
    </>
  );
}
