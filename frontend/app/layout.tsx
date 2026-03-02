import type { ReactNode } from 'react';
import '../globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: 'Judge Agent - Judicial Reasoning Platform',
  description: 'A judicial reasoning and decision-making agent for the Feltsense platform',
};

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
