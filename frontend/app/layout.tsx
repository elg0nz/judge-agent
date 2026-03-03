import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Judge Agent — Coding Assignment by Glo Maldonado (sanscourier.ai)',
  description:
    'Judge Agent is a coding assignment project by Glo Maldonado (sanscourier.ai) for evaluating whether content was created by a human or AI.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
