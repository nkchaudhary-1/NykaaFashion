import type { Metadata } from "next";
import { ProfileView } from "@/components/account/ProfileView";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
  return <ProfileView />;
}
