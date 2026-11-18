import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export interface StepDef {
  number: number;
  label: string;
  shortLabel: string;
}

export const BRIEF_STEPS: StepDef[] = [
  { number: 1, label: 'Service Category', shortLabel: 'Service' },
  { number: 2, label: 'Project Type', shortLabel: 'Type' },
  { number: 3, label: 'Project Details', shortLabel: 'Details' },
  { number: 4, label: 'Features & Scope', shortLabel: 'Features' },
  { number: 5, label: 'Existing Assets', shortLabel: 'Assets' },
  { number: 6, label: 'Timeline', shortLabel: 'Timeline' },
  { number: 7, label: 'Indicative Budget', shortLabel: 'Budget' },
  { number: 8, label: 'Additional & Files', shortLabel: 'Files' },
  { number: 9, label: 'Review & Submit', shortLabel: 'Review' },
];

interface BriefStepperProps {
  currentStep: number;
  completedSteps: number[];
  onSelectStep: (step: number) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave?: () => void;
}

export const BriefStepper: React.FC<BriefStepperProps> = ({
  currentStep,
  completedSteps,
  onSelectStep,
  saveStatus,
  onRetrySave,
}) => {
  const progressPercent = Math.round(((currentStep - 1) / (BRIEF_STEPS.length - 1)) * 100);
  const maxAccessibleStep = Math.max(...completedSteps, currentStep);

  return (
    <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5">
        {/* Top bar with step counter and autosave status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[13px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[var(--color-text-primary)] tabular-nums whitespace-nowrap">
              Step {currentStep} of {BRIEF_STEPS.length}
            </span>
            <span className="text-[var(--color-border-strong)]" aria-hidden="true">
              ·
            </span>
            <span className="text-[var(--color-text-secondary)] font-medium truncate">
              {BRIEF_STEPS[currentStep - 1]?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs" aria-live="polite">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-text-muted)]" aria-hidden="true" />
                Saving draft…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)]">
                <Check className="w-3.5 h-3.5 text-[var(--color-success)]" aria-hidden="true" />
                Draft saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-error-text)] font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--color-error)]" aria-hidden="true" />
                Couldn’t save changes
                {onRetrySave && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetrySave();
                    }}
                    className="ml-1 underline hover:text-[var(--color-text-primary)] font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
                  >
                    Retry
                  </button>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Compact Mobile Progress & Section Switcher (< sm) */}
        <div className="sm:hidden space-y-2.5">
          <div
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={BRIEF_STEPS.length}
            aria-label={`Step ${currentStep} of ${BRIEF_STEPS.length}`}
            className="w-full h-1.5 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[var(--color-primary)] transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${currentStep / BRIEF_STEPS.length})` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor="brief-mobile-step-jump" className="text-xs text-[var(--color-text-secondary)] shrink-0">
              Jump to step:
            </label>
            <select
              id="brief-mobile-step-jump"
              value={currentStep}
              onChange={(e) => onSelectStep(Number(e.target.value))}
              className="flex-1 max-w-[220px] px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {BRIEF_STEPS.map((step) => {
                const isAccessible =
                  completedSteps.includes(step.number) || step.number <= maxAccessibleStep;
                return (
                  <option key={step.number} value={step.number} disabled={!isAccessible}>
                    {step.number}. {step.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Tablet & Desktop 9-Step Progress Rail (sm+) */}
        <nav aria-label="Project Brief Progress" className="relative hidden sm:block">
          {/* Progress track background */}
          <div className="absolute top-3.5 left-0 right-0 h-px bg-[var(--color-border)] -z-0" />
          {/* Active progress fill */}
          <div
            className="absolute top-3.5 left-0 h-px bg-[var(--color-primary)] transition-all duration-200 -z-0"
            style={{ width: `${progressPercent}%` }}
          />

          <ol className="flex items-center justify-between relative z-10">
            {BRIEF_STEPS.map((step) => {
              const isCurrent = step.number === currentStep;
              const isCompleted = completedSteps.includes(step.number) && !isCurrent;
              const isAccessible = isCompleted || step.number <= maxAccessibleStep;

              return (
                <li key={step.number} className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!isAccessible}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Step ${step.number}: ${step.label}${isCompleted ? ' (completed)' : ''}`}
                    onClick={() => onSelectStep(step.number)}
                    className={`group flex flex-col items-center p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-md ${
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums transition-colors ${
                        isCurrent
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] ring-4 ring-[var(--color-surface-secondary)]'
                          : isCompleted
                          ? 'bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary)]'
                          : 'bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] group-hover:border-[var(--color-text-muted)]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : step.number}
                    </div>

                    <span
                      className={`mt-1.5 text-xs font-medium hidden lg:block text-center whitespace-nowrap ${
                        isCurrent
                          ? 'text-[var(--color-text-primary)] font-semibold'
                          : isCompleted
                          ? 'text-[var(--color-text-secondary)]'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {step.shortLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
