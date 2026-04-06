import './global.css';
import { cn, ThemeProvider } from 'ui-common';

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
    <html lang="en" className={cn('font-sans')}>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
