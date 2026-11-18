import type { Metadata } from "next";
import { SubscriptionsView } from "@/components/admin/AdminViews";

export const metadata: Metadata = { title: "Admin: Subscriptions" };

export default function Page() {
  return <SubscriptionsView />;
}
