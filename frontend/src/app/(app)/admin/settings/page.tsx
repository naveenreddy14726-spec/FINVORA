import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/AdminViews";

export const metadata: Metadata = { title: "Admin: Settings" };

export default function Page() {
  return <SettingsView />;
}
