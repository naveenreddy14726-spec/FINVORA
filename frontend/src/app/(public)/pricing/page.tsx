import type { Metadata } from "next";
import { ComparisonTable, FaqList, PageHeading, PlanCards } from "@/components/PublicBlocks";
import { PRO_PRICE_INR, TRIAL_DAYS } from "@/lib/site";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <PageHeading title="Pricing" subtitle="Start free. Upgrade only if you need higher limits and advanced tools." />
      <PlanCards />
      <section className="py-14">
        <h2 className="mb-6 text-center text-2xl font-bold">Compare plans</h2>
        <ComparisonTable />
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-6 text-sm text-slate-700">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Trial, billing and cancellation</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Eligible users can start a {TRIAL_DAYS}-day Pro trial with no card details.</li>
          <li>After the trial you return to Free unless you choose to subscribe.</li>
          <li>Pro costs ₹{PRO_PRICE_INR} per month and is charged only after you authorize payment.</li>
          <li>You can cancel anytime. Pro stays active until the end of the period you paid for.</li>
          <li>Payments are processed by Razorpay. Finvora never stores card details.</li>
        </ul>
      </section>
      <section className="py-14">
        <h2 className="mb-6 text-center text-2xl font-bold">Frequently asked questions</h2>
        <FaqList />
      </section>
    </>
  );
}
