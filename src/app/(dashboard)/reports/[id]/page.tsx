'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'draft' | 'pending_review' | 'approved' | 'sent'>('draft');
  const [loading, setLoading] = useState(false);

  // TODO: Fetch report details from API using params.id

  const handleSubmitForReview = async () => {
    setLoading(true);
    try {
      // TODO: Call API to update report status
      setStatus('pending_review');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      // TODO: Call API to approve report
      setStatus('approved');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // TODO: Call API to send report
      setStatus('sent');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Report</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">January 2024 Report</p>
        </div>

        <span className={`rounded-full px-4 py-2 text-sm font-medium ${statusColors[status]}`}>
          {status === 'draft'
            ? 'Draft'
            : status === 'pending_review'
              ? 'Pending Review'
              : status === 'approved'
                ? 'Approved'
                : 'Sent'}
        </span>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">2,543</p>
          <p className="text-xs text-green-600 dark:text-green-400">+12% from last month</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Sessions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">12,847</p>
          <p className="text-xs text-green-600 dark:text-green-400">+8.5% from last month</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Bounce Rate</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">34.2%</p>
          <p className="text-xs text-red-600 dark:text-red-400">+2.3% from last month</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Duration</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">2m 34s</p>
          <p className="text-xs text-green-600 dark:text-green-400">+15 seconds from last month</p>
        </Card>
      </div>

      {/* AI Narrative */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Report Summary</h2>
        <div className="mt-4 space-y-4 text-slate-700 dark:text-slate-300">
          <p>
            This month saw strong user growth with a 12% increase in unique visitors compared to December. The website attracted 2,543 users who initiated 12,847 sessions, representing steady platform engagement.
          </p>
          <p>
            Session quality metrics show users spending an average of 2 minutes and 34 seconds on the site, up significantly from the previous month. However, the bounce rate increased to 34.2%, which warrants attention to entry page optimization.
          </p>
          <p>
            Peak traffic occurred on Thursdays and Fridays, with the product pages driving the highest engagement. We recommend focusing marketing efforts on these high-performing segments.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {status === 'draft' && (
          <Button onClick={handleSubmitForReview} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        )}

        {status === 'pending_review' && (
          <>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve Report'}
            </Button>
            <Button variant="outline" disabled={loading}>
              Request Changes
            </Button>
          </>
        )}

        {(status === 'approved' || status === 'pending_review') && (
          <Button onClick={handleSend} disabled={loading} variant={status === 'approved' ? 'primary' : 'secondary'}>
            {loading ? 'Sending...' : 'Send Report'}
          </Button>
        )}

        {status === 'sent' && <Button disabled>Report Sent</Button>}

        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
