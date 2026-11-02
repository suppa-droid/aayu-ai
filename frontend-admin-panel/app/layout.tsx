import './globals.css';
import AppChrome from '../components/AppChrome';

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
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
