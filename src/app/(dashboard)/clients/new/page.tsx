import { createSupabaseServerClient } from '@/lib/db/client';
import { createClient } from '@/lib/db/repositories/clientRepo';
import { redirect } from 'next/navigation';

export default async function NewClientPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const agencyId = (user.user_metadata as any).agency_id;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const scheduleDay = parseInt(formData.get('scheduleDay') as string);

    await createClient(agencyId, {
      name,
      contact_email: email,
      schedule_day: scheduleDay,
      report_emails: [email],
      timezone: 'UTC'
    });

    redirect('/clients');
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Add New Client</h1>
        <p className="text-gray-400 text-sm mt-1">Setup a new client profile to start generating reports</p>
      </div>

      <form action={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client Name</label>
          <input 
            name="name"
            type="text" 
            required
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Email</label>
           <input 
            name="email"
            type="email" 
            required
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
            placeholder="reports@acme.com"
          />
        </div>

        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Schedule Day (1-28)</label>
           <input 
            name="scheduleDay"
            type="number" 
            min="1" 
            max="28"
            required
            defaultValue="1"
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
          />
          <p className="text-[10px] text-gray-600 mt-2 italic">Reports will be queued for generation on this day every month.</p>
        </div>

        <div className="pt-4 border-t border-gray-800 flex gap-3">
          <a href="/clients" className="px-6 py-2 rounded-lg border border-gray-800 text-gray-400 font-medium hover:bg-gray-800 transition-all">Cancel</a>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-all">
            Create Client
          </button>
        </div>
      </form>
    </div>
  );
}
