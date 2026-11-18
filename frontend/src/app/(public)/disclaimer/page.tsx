import type { Metadata } from "next";
import { LegalPage } from "@/components/PublicBlocks";

export const metadata: Metadata = { title: "Financial disclaimer" };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Financial disclaimer">
      <p>Finvora provides research information and educational tools. It is not a registered investment adviser, broker or research analyst, and nothing on Finvora is personalized investment advice.</p>
      <p>AI-generated analysis can be incomplete or wrong. It is informational, is based on data available at the time shown, and must not be treated as a prediction or guarantee of future returns.</p>
      <p>Investing in securities involves risk, including loss of capital. Verify important information with original sources and consider consulting a qualified, registered financial adviser before making decisions.</p>
      <p>Market data may be delayed, and its freshness is labelled where shown.</p>
    </LegalPage>
  );
}
