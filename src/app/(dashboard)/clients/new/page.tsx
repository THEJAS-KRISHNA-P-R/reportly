import { ClientForm } from '@/components/clients/client-form';

export default function NewClientPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Client</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Create a new client to start tracking analytics.
        </p>
      </div>

      <ClientForm />
    </div>
  );
}
