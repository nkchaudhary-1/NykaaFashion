import type { Metadata } from "next";
import { SavedPaymentsView } from "@/components/account/SavedPaymentsView";

export const metadata: Metadata = { title: "Saved payments" };

export default function SavedPaymentsPage() {
  return <SavedPaymentsView />;
}
