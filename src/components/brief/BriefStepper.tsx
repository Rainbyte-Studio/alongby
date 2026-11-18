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
    <div className="w-full bg-white border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar with step counter and autosave badge */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">
              Step {currentStep} of {BRIEF_STEPS.length}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-600">
              {BRIEF_STEPS[currentStep - 1]?.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-neutral-500 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Saving…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-neutral-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Draft saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Couldn’t save changes
                {onRetrySave && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetrySave();
                    }}
                    className="ml-1 underline hover:text-rose-700 font-semibold cursor-pointer focus:outline-hidden"
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
          <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-neutral-200 -z-0 hidden md:block" />
          {/* Active progress fill */}
          <div
            className="absolute top-3.5 left-0 h-0.5 bg-neutral-900 transition-all duration-300 hidden md:block -z-0"
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
                    className={`group flex flex-col items-center focus:outline-hidden ${
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-neutral-950 text-white ring-4 ring-neutral-100 shadow-xs'
                          : isCompleted
                          ? 'bg-neutral-800 text-white hover:bg-neutral-950'
                          : 'bg-white border border-neutral-300 text-neutral-500 group-hover:border-neutral-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                    </div>

                    <span
                      className={`mt-1 text-[11px] font-medium hidden lg:block tracking-tight text-center ${
                        isCurrent
                          ? 'text-neutral-950 font-semibold'
                          : isCompleted
                          ? 'text-neutral-700'
                          : 'text-neutral-400'
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
