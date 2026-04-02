import './global.css';
import { Geist } from 'next/font/google';
import { cn } from 'ui-common/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Flavor Map',
  description: 'Module-oriented Nx frontend baseline with shadcn/ui',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
