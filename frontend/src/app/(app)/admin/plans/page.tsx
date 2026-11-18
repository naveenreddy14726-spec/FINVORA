import type { Metadata } from "next";
import { PlansView } from "@/components/admin/AdminViews";

export const metadata: Metadata = { title: "Admin: Plans" };

export default function Page() {
  return <PlansView />;
}
