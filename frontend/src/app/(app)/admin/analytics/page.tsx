import type { Metadata } from "next";
import { AnalyticsView } from "@/components/admin/AdminViews";

export const metadata: Metadata = { title: "Admin: Analytics" };

export default function Page() {
  return <AnalyticsView />;
}
