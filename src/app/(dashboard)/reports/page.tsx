import { getReportsByAgency } from '@/lib/db/repositories/reportRepo';
import { createSupabaseServerClient } from '@/lib/db/client';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const agencyId = (user.user_metadata as any).agency_id;
  const reports = await getReportsByAgency(agencyId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600/20 text-green-400';
      case 'draft': return 'bg-yellow-600/20 text-yellow-500';
      case 'sent': return 'bg-indigo-600/20 text-indigo-400';
      case 'generating': return 'bg-blue-600/20 text-blue-400 animate-pulse';
      case 'failed': return 'bg-red-600/20 text-red-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">All Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Status of all automated and manual report generations</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800/50 text-gray-400 font-medium border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Generated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No reports generated yet.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{(report as any).clients?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(report.period_start).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(report.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/reports/${report.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">View</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
