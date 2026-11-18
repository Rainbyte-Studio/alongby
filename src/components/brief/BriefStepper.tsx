import React from 'react';
import { Check } from 'lucide-react';

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
  return (
    <div className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5">
        {/* Top bar with step counter and autosave status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[13px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[var(--color-text-primary)] tabular-nums whitespace-nowrap">
              Step {currentStep} of {BRIEF_STEPS.length}
            </span>
            <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
            <span className="text-[var(--color-text-secondary)] font-medium truncate">
              {BRIEF_STEPS[currentStep - 1]?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
                Saving…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                Draft saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-error-text)] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
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

        {/* Stepper bar */}
        <nav aria-label="Project Brief Progress" className="relative">
          {/* Progress track background */}
          <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-[var(--color-border)] -z-0 hidden md:block" />
          {/* Active progress fill */}
          <div
            className="absolute top-3.5 left-0 h-0.5 bg-[var(--color-primary)] transition-all duration-300 hidden md:block -z-0"
            style={{
              width: `${((currentStep - 1) / (BRIEF_STEPS.length - 1)) * 100}%`,
            }}
          />

          <ol className="flex items-center justify-between relative z-10">
            {BRIEF_STEPS.map((step) => {
              const isCurrent = step.number === currentStep;
              const isCompleted = completedSteps.includes(step.number) && !isCurrent;
              const isAccessible =
                isCompleted || step.number <= Math.max(...completedSteps, currentStep);

              return (
                <li key={step.number} className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => onSelectStep(step.number)}
                    className={`group flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-md ${
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums transition-colors ${
                        isCurrent
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] ring-4 ring-[var(--color-surface-secondary)]'
                          : isCompleted
                          ? 'bg-[#303030] text-white hover:bg-[var(--color-primary)]'
                          : 'bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] group-hover:border-[var(--color-text-muted)]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
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
