'use client';

import { useState, useEffect } from 'react';

export default function AdminFlagsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/flags').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="text-sm font-mono text-gray-500">Loading flags...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold mb-8">Feature Flags</h1>
      
      <div className="space-y-4">
        {Object.entries(data.flags || {}).map(([key, val]) => (
          <div key={key} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <span className="font-mono text-sm">{key}</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {val ? 'TRUE' : 'FALSE'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
