import type { Metadata } from "next";
import Gate from "@/components/Gate";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <Gate endpoint="/api/me" title="Your account" />;
}
