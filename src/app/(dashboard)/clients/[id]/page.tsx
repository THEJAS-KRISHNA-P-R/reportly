import { getClientById } from '@/lib/db/repositories/clientRepo';
import { getReportsByClient } from '@/lib/db/repositories/reportRepo';
import { getConnectionsByClient } from '@/lib/db/repositories/connectionRepo';
import { createSupabaseServerClient } from '@/lib/db/client';
import { notFound, redirect } from 'next/navigation';

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const agencyId = (user.user_metadata as any).agency_id;
  const client = await getClientById(params.id, agencyId);
  if (!client) notFound();

  const connections = await getConnectionsByClient(client.id);
  const reports = await getReportsByClient(client.id, agencyId);

  const ga4 = connections.find(c => c.platform === 'ga4');

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <a href="/clients" className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </a>
        <h1 className="text-2xl font-bold text-white">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Info & Connections */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Client Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <p className="text-white text-sm">{client.contact_email || 'No email set'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Schedule</label>
                <p className="text-white text-sm">Every month on the {client.schedule_day}{client.schedule_day === 1 ? 'st' : 'th'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Connections</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${ga4?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white font-medium text-sm">Google Analytics 4</span>
                </div>
                {ga4?.status === 'connected' ? (
                  <span className="text-xs text-gray-500 underline">{ga4.account_id}</span>
                ) : (
                  <a 
                    href={`/api/oauth/ga4?clientId=${client.id}`}
                    className="text-xs text-indigo-400 hover:underline font-bold"
                  >
                    Connect
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Report History */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
              <h3 className="text-sm font-semibold text-white">Report History</h3>
            </div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-800">
                {reports.length === 0 ? (
                  <tr><td className="px-6 py-12 text-center text-gray-500 italic">No reports yet.</td></tr>
                ) : (
                  reports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4 text-white">
                        {new Date(report.period_start).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">
                        {report.status}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a href={`/reports/${report.id}`} className="text-indigo-400 hover:text-indigo-300">View</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
