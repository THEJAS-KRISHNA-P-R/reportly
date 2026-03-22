import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mb-8 inline-flex text-sm font-medium text-blue-600 hover:text-blue-500">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        <div className="mt-8 space-y-6 text-slate-600 dark:text-slate-400">
          <p>
            This is a placeholder for the privacy policy. In production, this should contain your full privacy policy.
          </p>
          <p>
            Contact: privacy@reportly.ai
          </p>
        </div>
      </div>
    </main>
  )
}
