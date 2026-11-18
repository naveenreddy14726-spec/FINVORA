import type { Metadata } from "next";
import { PageHeading } from "@/components/PublicBlocks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeading title="Contact" subtitle="Questions, feedback or support requests." />
      <div className="mx-auto max-w-xl px-4 pb-16 text-center text-slate-700">
        {SITE.contactEmail ? (
          <p>
            Email us at{" "}
            <a className="font-medium text-indigo-600 hover:underline" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            .
          </p>
        ) : (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Contact email not configured yet. Set <code>NEXT_PUBLIC_CONTACT_EMAIL</code> in <code>frontend/.env.local</code>.
          </p>
        )}
      </div>
    </>
  );
}
