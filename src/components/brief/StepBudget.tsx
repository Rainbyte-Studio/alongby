import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { budgetAssessmentService } from '../../services/budgetAssessmentService';
import { ProjectBrief } from '../../types';
import { HelpCircle, Check, Info } from 'lucide-react';

interface StepBudgetProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
}

export const StepBudget: React.FC<StepBudgetProps> = ({ brief, onChange }) => {
  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const currentBudget = brief.budget || {
    budgetType: 'range',
    selectedRangeId: 'eur_2000_3500',
    minAmountMinor: 200000,
    maxAmountMinor: 350000,
    currency: 'EUR',
    isIndicative: true,
  };

  const handleSelectRange = (rangeId: string) => {
    const range = budgetRanges.find((r) => r.id === rangeId);
    if (!range) return;

    onChange({
      budget: {
        budgetType: 'range',
        selectedRangeId: range.id,
        minAmountMinor: range.minAmountMinor,
        maxAmountMinor: range.maxAmountMinor,
        currency: range.currency,
        isIndicative: true,
      },
    });
  };

  const handleSelectUnsure = () => {
    onChange({
      budget: {
        budgetType: 'unsure',
        selectedRangeId: undefined,
        minAmountMinor: undefined,
        maxAmountMinor: undefined,
        currency: 'EUR',
        isIndicative: true,
      },
    });
  };

  const assessment = budgetAssessmentService.assessBudget(brief);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          What is your indicative budget?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Select an indicative investment range. This helps Alongby recommend practitioners whose typical engagement size aligns with your project.
        </p>
      </div>

      {/* Clear product disclaimer card */}
      <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-xs text-[var(--color-warning-text)] flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">
            Indicative Estimate Only:
          </strong>{' '}
          This selection is not a binding commitment or guaranteed final price. Matched professionals will review your complete brief and present custom proposals with tailored milestone schedules.
        </div>
      </div>

      {/* Budget range selection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {budgetRanges.map((range) => {
          const isSelected =
            currentBudget.budgetType === 'range' &&
            currentBudget.selectedRangeId === range.id;

          return (
            <button
              key={range.id}
              type="button"
              onClick={() => handleSelectRange(range.id)}
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-sans text-base sm:text-[17px] font-bold tabular-nums text-[var(--color-text-primary)]">
                  {range.label}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center text-xs shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {range.openEnded
                  ? 'Large-scale, complex software or full product builds'
                  : 'Target range in EUR'}
              </div>
            </button>
          );
        })}

        {/* Option: I'm not sure */}
        <button
          type="button"
          onClick={handleSelectUnsure}
          aria-pressed={currentBudget.budgetType === 'unsure'}
          className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            currentBudget.budgetType === 'unsure'
              ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-sans text-[15px] font-semibold text-[var(--color-text-primary)]">
              I am not sure
            </span>
            {currentBudget.budgetType === 'unsure' && (
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center text-xs shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            Let Alongby recommend pricing based on submitted scope
          </div>
        </button>
      </div>

      {/* Subtle assessment feedback */}
      <div className="pt-2 text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
        <span>{assessment.explanation}</span>
      </div>
    </div>
  );
};
