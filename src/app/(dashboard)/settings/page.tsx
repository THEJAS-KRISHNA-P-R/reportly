import { createSupabaseServerClient } from '@/lib/db/client';
import { getAgencyById } from '@/lib/db/repositories/agencyRepo';
import { updateAgency } from '@/lib/db/repositories/agencyRepo';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const agencyId = (user.user_metadata as any).agency_id;
  const agency = await getAgencyById(agencyId);

  if (!agency) return <div className="p-8 text-white">Agency not found.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agency Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your agency branding for reports and emails</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Agency Name</label>
          <input 
            type="text" 
            defaultValue={agency.name}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
            readOnly // Form handling in next step
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Brand Color</label>
          <div className="flex gap-4 items-center">
            <div 
              className="w-10 h-10 rounded-lg border border-gray-800" 
              style={{ backgroundColor: agency.brand_color || '#3b82f6' }}
            ></div>
            <input 
              type="text" 
              defaultValue={agency.brand_color || '#3b82f6'}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none"
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Logo URL</label>
          <input 
            type="text" 
            defaultValue={agency.logo_url || ''}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none"
            placeholder="https://..."
            readOnly
          />
        </div>

        <div className="pt-4 border-t border-gray-800">
          <button className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
            Save Changes (Manual update required for MVP)
          </button>
        </div>
      </div>
    </div>
  );
}
