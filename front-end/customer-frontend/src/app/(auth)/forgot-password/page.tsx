import type { Metadata } from 'next';
import PasswordReset from '@/components/auth/PasswordReset';

export const metadata: Metadata = {
  title: 'Forgot Password | Gajraj Paithani',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function Page() { return <PasswordReset mode="request" />; }
