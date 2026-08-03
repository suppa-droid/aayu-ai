import './globals.css';
import Link from 'next/link';
import Navigation from '../components/Navigation';

export const metadata = {
  title: 'Aayu AI - District & System Admin Governance Panel',
  description: 'AI-assisted administrative oversight, grievance escalations, and system management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
