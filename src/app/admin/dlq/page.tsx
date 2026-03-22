'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function AdminDLQPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/dlq').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="text-sm font-mono text-gray-500">Loading DLQ...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold mb-8">Dead Letter Queue</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3">Job ID</th>
              <th className="px-6 py-3">Error</th>
              <th className="px-6 py-3">Client ID</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {data.dlq_jobs?.map((job: any) => (
              <tr key={job.id}>
                <td className="px-6 py-4">{job.id}</td>
                <td className="px-6 py-4 text-red-600 flex items-center gap-2">
                  <AlertCircle size={14}/> {job.error}
                </td>
                <td className="px-6 py-4">{job.client_id}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:underline">Retry</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
