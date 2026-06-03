import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AasaMedChem | Inventory & Order Management System',
  description: 'An advanced chemical inventory tracking and order placement platform featuring high-precision unit conversions and role-based panels.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
