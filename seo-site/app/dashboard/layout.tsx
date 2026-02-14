import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — CricSmart',
  description: 'Your CricSmart dashboard. Access all your teams, tournaments, and auctions in one place.',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Uses the same layout as auth pages — minimal, no extra chrome needed
  // The root layout already provides Header/Footer
  return <>{children}</>;
}
