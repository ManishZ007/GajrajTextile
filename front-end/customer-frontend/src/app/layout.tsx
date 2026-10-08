import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { NotificationContainer } from '@/components/Notification/NotificationContainer';

export const metadata: Metadata = {
  title: 'GAJRAJ PAITHANI',
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
        <NotificationContainer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
