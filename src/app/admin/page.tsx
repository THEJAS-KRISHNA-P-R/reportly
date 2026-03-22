'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="text-sm font-mono text-gray-500">Initializing...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold mb-8">Platform Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 text-gray-500 mb-4"><Users size={16}/> Agencies</div>
          <p className="text-4xl font-semibold">{data.metrics?.total_agencies}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 text-gray-500 mb-4"><FileText size={16}/> Daily Reports</div>
          <p className="text-4xl font-semibold">{data.metrics?.active_reports_today}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 text-gray-500 mb-4"><Activity size={16}/> System Health</div>
          <p className="text-4xl font-semibold text-green-700">{data.metrics?.system_health}</p>
        </div>
      </div>
    </div>
  );
}
