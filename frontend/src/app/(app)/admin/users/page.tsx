import type { Metadata } from "next";
import { Suspense } from "react";
import UsersView from "@/components/admin/UsersView";

export const metadata: Metadata = { title: "Admin: Users" };

export default function UsersPage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading...</p>}>
      <UsersView />
    </Suspense>
  );
}
