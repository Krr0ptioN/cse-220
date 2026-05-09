import 'ui-common/styles/global.css';
import { cn } from 'ui-common';
import { Metadata } from 'next';
import { Navigation } from './_components/navigation';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Flavor Map',
  description: 'Module-oriented Nx frontend baseline with shadcn/ui',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('font-sans')}>
      <body className="antialiased">
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
