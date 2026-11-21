import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'GradeCraft — KTU 2024 CGPA & Scenario Predictor',
  description: 'Precision academic scenario planner, SGPA/CGPA simulator with multi-instance modeling, challenged course exemptions, and KTU 2024 B.Tech curriculum.',
  keywords: ['KTU', 'CGPA Predictor', 'SGPA Calculator', 'B.Tech AI ML', 'GradeCraft', 'KTU 2024'],
  authors: [{ name: 'Adithyen' }],
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen bg-black text-[#f5f5f7] antialiased selection:bg-[#0071e3] selection:text-white">
        {children}
      </body>
    </html>
  );
}
