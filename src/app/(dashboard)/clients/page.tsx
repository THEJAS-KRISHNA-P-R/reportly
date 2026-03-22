import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ClientsPage() {
  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Manage all your clients and their reports.</p>
        </div>
        <Button asChild>
          <a href="/dashboard/clients/new">Add Client</a>
        </Button>
      </div>

      {/* Empty State */}
      <Card className="p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No clients yet</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Create your first client to start tracking analytics.</p>
        <Button asChild className="mt-6">
          <a href="/dashboard/clients/new">Create Client</a>
        </Button>
      </Card>
    </div>
  )
}
