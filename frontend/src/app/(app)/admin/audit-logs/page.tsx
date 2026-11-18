import type { Metadata } from "next";
import { AuditLogsView } from "@/components/admin/AdminViews";

export const metadata: Metadata = { title: "Admin: Audit logs" };

export default function Page() {
  return <AuditLogsView />;
}
