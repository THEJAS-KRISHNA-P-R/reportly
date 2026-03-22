'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function AdminJobsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/jobs').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="text-sm font-mono text-gray-500">Connecting to queue...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold mb-8">Worker Queue</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm mb-2">Active</p>
          <p className="text-3xl font-bold text-blue-600">{data.active}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm mb-2">Waiting</p>
          <p className="text-3xl font-bold">{data.waiting}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm mb-2">Completed Today</p>
          <p className="text-3xl font-bold text-green-600">{data.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm mb-2">Failed</p>
          <p className="text-3xl font-bold text-red-600">{data.failed}</p>
        </div>
      </div>
    </div>
  );
}
