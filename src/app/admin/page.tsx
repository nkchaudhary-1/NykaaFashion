import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminDashboard } from "@/components/team/AdminDashboard";

export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false, follow: false } };

/** Administrators only: the server refuses /admin to every other account before this page is served (src/proxy.ts). */
export default function AdminPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Home", href: "/" }, { name: "Admin" }]} eyebrow="Admin" title={<>Login <em>activity.</em></>} intro="Who signed in, when, and how often — for the accounts that can open this prototype." />
      <AdminDashboard />
    </>
  );
}
