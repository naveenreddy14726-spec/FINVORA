import type { Metadata } from "next";
import OverviewView from "@/components/admin/OverviewView";

export const metadata: Metadata = { title: "Admin dashboard" };

export default function AdminPage() {
  return <OverviewView />;
}
