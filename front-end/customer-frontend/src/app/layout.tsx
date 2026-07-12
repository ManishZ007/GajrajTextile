import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { NotificationContainer } from '@/components/Notification/NotificationContainer';

export const metadata: Metadata = {
  title: 'Gajraj',
  description: 'Gajraj foundation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiase`}>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <NotificationContainer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
