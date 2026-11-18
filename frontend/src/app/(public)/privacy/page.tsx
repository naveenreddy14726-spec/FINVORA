import type { Metadata } from "next";
import { LegalPage } from "@/components/PublicBlocks";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>This page describes what Finvora collects and why. It will be finalized before launch.</p>
      <h2 className="text-lg font-semibold text-slate-900">Information we collect</h2>
      <p>Account details (email, name), usage data such as AI question counts, and the watchlists and notes you save.</p>
      <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
      <p>Payments are handled by Razorpay. Finvora does not store card numbers.</p>
      <h2 className="text-lg font-semibold text-slate-900">How we use it</h2>
      <p>To run your account, enforce plan limits, provide support, and keep the service secure. We do not sell personal data.</p>
      <h2 className="text-lg font-semibold text-slate-900">Your choices</h2>
      <p>You can request access to or deletion of your data through the contact page.</p>
    </LegalPage>
  );
}
