import type { Metadata } from "next";
import { FaqList, PageHeading } from "@/components/PublicBlocks";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <PageHeading title="Frequently asked questions" />
      <div className="pb-16">
        <FaqList />
      </div>
    </>
  );
}
