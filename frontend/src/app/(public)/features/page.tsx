import type { Metadata } from "next";
import { PageHeading } from "@/components/PublicBlocks";
import { FEATURES } from "@/lib/site";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <>
      <PageHeading title="Features" subtitle="Tools for understanding a company before you form a view." />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-3xl px-4 pb-16 text-center text-sm text-slate-500">
        Some features are still being built and will be released in stages.
      </p>
    </>
  );
}
