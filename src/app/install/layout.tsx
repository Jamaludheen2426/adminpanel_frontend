import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup Wizard',
  description: 'Install and configure your application',
};

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Top bar with app name */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">A</span>
          </div>
          <span className="font-semibold text-sm">Admin Panel</span>
          <span className="text-muted-foreground text-sm ml-1">— Setup Wizard</span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}