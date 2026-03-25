'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/page-loader';
import {
  Download,
  Mail,
  Brain,
  BarChart3,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

interface CurrentStep {
  name: string;
  percentage: number;
  status: 'in_progress' | 'success' | 'failed';
  last_error?: string;
}

interface ReportProgressCardProps {
  reportId: string;
  initialStatus: string;
  initialStep?: CurrentStep | null;
  pollIntervalMs?: number;
}

const PIPELINE_STEPS = [
  { key: 'fetch',     label: 'Fetching Analytics',  icon: Download },
  { key: 'validate',  label: 'Validating Data',     icon: BarChart3 },
  { key: 'narrative', label: 'Generating Narrative', icon: Brain },
  { key: 'pdf',       label: 'Assembling PDF',      icon: FileText },
  { key: 'email',     label: 'Sending Email',       icon: Mail },
];

/**
 * Real-time progress card for reports in 'generating' or 'queued' state.
 * Polls the report API to show live pipeline step progress.
 */
export function ReportProgressCard({
  reportId,
  initialStatus,
  initialStep,
  pollIntervalMs = 3000,
}: ReportProgressCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [currentStep, setCurrentStep] = useState<CurrentStep | null>(initialStep || null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.report?.status || status);
      setCurrentStep(data.report?.current_step || null);
    } catch {
      // Silently fail — don't disrupt the UI
    }
  }, [reportId, status]);

  useEffect(() => {
    // Only poll for active reports
    if (status !== 'generating' && status !== 'queued') return;

    const interval = setInterval(fetchProgress, pollIntervalMs);
    return () => clearInterval(interval);
  }, [status, fetchProgress, pollIntervalMs]);

  const percentage = currentStep?.percentage ?? 0;
  const stepName = currentStep?.name ?? 'Initializing...';
  const isComplete = status === 'draft' || status === 'approved';
  const isFailed = status === 'failed';
  const isActive = status === 'generating' || status === 'queued';

  if (!isActive && !isFailed) return null;

  // Determine which pipeline step is active
  const activeStepIndex = getActiveStepIndex(stepName);

  return (
    <Card className="p-5 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive && <Spinner size={18} className="text-indigo-600" />}
            {isFailed && <XCircle size={18} className="text-red-500" />}
            {isComplete && <CheckCircle2 size={18} className="text-emerald-500" />}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {isFailed ? 'Generation Failed' : `Report Generating`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stepName}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isFailed
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Pipeline Step Indicators */}
        <div className="flex items-center justify-between px-1">
          {PIPELINE_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isDone = index < activeStepIndex;
            const isCurrent = index === activeStepIndex && isActive;

            return (
              <div key={step.key} className="flex flex-col items-center gap-1">
                <div
                  className={`rounded-full p-1.5 transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                      : isCurrent
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 animate-pulse'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={14} />
                  ) : isCurrent ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <StepIcon size={14} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold truncate max-w-[60px] text-center ${
                    isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {isFailed && currentStep?.last_error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mt-2">
            {currentStep.last_error}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Maps the current step name to the pipeline step index.
 */
function getActiveStepIndex(stepName: string): number {
  const lower = stepName.toLowerCase();
  if (lower.includes('fetch') || lower.includes('querying') || lower.includes('authorization')) return 0;
  if (lower.includes('verif') || lower.includes('valid') || lower.includes('harden')) return 1;
  if (lower.includes('synth') || lower.includes('narrat') || lower.includes('ai') || lower.includes('insight')) return 2;
  if (lower.includes('pdf') || lower.includes('assemb') || lower.includes('chart')) return 3;
  if (lower.includes('email') || lower.includes('notif') || lower.includes('audit')) return 4;
  if (lower.includes('complet') || lower.includes('success')) return 5;
  return 0;
}
