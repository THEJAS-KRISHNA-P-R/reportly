import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
