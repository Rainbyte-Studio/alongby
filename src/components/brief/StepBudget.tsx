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
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          What is your indicative budget?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Select an indicative investment range. This helps Alongby recommend practitioners whose typical engagement size aligns with your project.
        </p>
      </div>

      {/* Clear product disclaimer card */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-amber-950">
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
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-serif font-bold text-neutral-950">
                  {range.label}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-500">
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
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            currentBudget.budgetType === 'unsure'
              ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
              : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-neutral-900">
              I am not sure
            </span>
            {currentBudget.budgetType === 'unsure' && (
              <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-500">
            Let Alongby recommend pricing based on submitted scope
          </div>
        </button>
      </div>

      {/* Subtle assessment feedback */}
      <div className="pt-2 text-xs text-neutral-500 flex items-center gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
        <span>{assessment.explanation}</span>
      </div>
    </div>
  );
};
