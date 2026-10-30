import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginFlow } from "@/components/account/LoginFlow";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-x py-24" />}>
      <LoginFlow />
    </Suspense>
  );
}
