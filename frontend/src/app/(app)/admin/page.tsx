import type { Metadata } from "next";
import Gate from "@/components/Gate";

export const metadata: Metadata = { title: "Admin" };

// Stage 1 foundation. The backend (/api/admin/me) decides access; non-admins see "Access denied".
export default function AdminPage() {
  return <Gate endpoint="/api/admin/me" title="Admin" />;
}
