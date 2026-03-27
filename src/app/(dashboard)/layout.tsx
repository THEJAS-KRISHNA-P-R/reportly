import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Metadata } from 'next';
 
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-background no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
