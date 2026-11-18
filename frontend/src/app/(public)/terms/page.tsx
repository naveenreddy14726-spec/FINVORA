import type { Metadata } from "next";
import { LegalPage } from "@/components/PublicBlocks";
import { PRO_PRICE_INR, TRIAL_DAYS } from "@/lib/site";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions">
      <p>These terms will be finalized before launch. In summary:</p>
      <p>Finvora offers a Free plan and a Pro plan at ₹{PRO_PRICE_INR} per month. Eligible users may take a one-time {TRIAL_DAYS}-day Pro trial without card details.</p>
      <p>You are charged only after you authorize a payment. You may cancel at any time, and Pro remains active until the end of the paid period.</p>
      <p>You agree not to misuse the service, scrape it, or resell its data. Finvora is provided as is, and information shown is not investment advice. See the financial disclaimer.</p>
    </LegalPage>
  );
}
