import { requireSuperAdmin } from '@/lib/security/superAdmin';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  await requireSuperAdmin();


  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">System Administration</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor background workers, DLQ, and system-wide flags</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
           <h3 className="text-white font-bold mb-4">Background Workers</h3>
           <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-gray-950 rounded-lg border border-gray-800">
               <span className="text-sm text-gray-300">report-queue-worker</span>
               <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-1 rounded-full font-bold uppercase">Active</span>
             </div>
           </div>
         </div>

         <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
           <h3 className="text-white font-bold mb-4">Dead Letter Queue (DLQ)</h3>
           <div className="text-center py-8">
             <p className="text-gray-500 text-sm italic">DLQ is currently empty. Everything is running smoothly.</p>
           </div>
         </div>
      </div>

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Active System Flags</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">AI Content</span>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
             </div>
             <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex justify-between items-center opacity-50">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Email Live</span>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
             </div>
          </div>
      </div>
    </div>
  );
}
