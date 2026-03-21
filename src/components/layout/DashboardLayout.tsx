import { Sidebar } from './Sidebar';
import { TopBar }  from './TopBar';
import React from 'react';

interface DashboardLayoutProps {
  children:   React.ReactNode;
  agencyName: string;
  plan:       string;
  email:      string;
  title:      string;
  actions?:   React.ReactNode;
}

export function DashboardLayout({
  children, agencyName, plan, email, title, actions,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar agencyName={agencyName} plan={plan} email={email} />
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <TopBar title={title} actions={actions} />
        <main className="flex-1 p-8 max-w-[1100px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
