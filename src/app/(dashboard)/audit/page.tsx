'use client';

import { Card } from '@/components/ui/card';

interface AuditLog {
  id: string;
  event: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function AuditPage() {
  // TODO: Fetch audit logs from API
  const logs: AuditLog[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Audit Trail</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View all account activities and changes
        </p>
      </div>

      <Card>
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">No audit logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">{log.event}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{log.details}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    {log.user} • {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
