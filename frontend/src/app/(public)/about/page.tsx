import type { Metadata } from "next";
import { PageHeading } from "@/components/PublicBlocks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeading title="About Finvora" subtitle={SITE.tagline} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-16 text-slate-700">
        <p>
          Finvora is an AI-powered stock research platform. It exists to help people understand companies using sourced
          data, rather than tips or guesses.
        </p>
        <p>
          We follow a few rules. We do not invent financial data. We show the source and time of every figure. We say
          so when data is missing. We do not promise returns, and our AI analysis is information, not personal advice.
        </p>
        <p>Finvora is a new product and is being built in stages.</p>
      </div>
    </>
  );
}
