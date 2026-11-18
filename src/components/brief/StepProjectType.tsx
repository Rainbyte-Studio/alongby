import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Check } from 'lucide-react';

interface StepProjectTypeProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
  onBackToService: () => void;
}

export const StepProjectType: React.FC<StepProjectTypeProps> = ({
  brief,
  onChange,
  onBackToService,
}) => {
  const currentService = taxonomyService.getServiceCategoryById(brief.serviceId);
  const projectTypes = taxonomyService.getProjectTypesForService(brief.serviceId);

  if (!currentService) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Please select a primary service category before choosing a project type.
        </p>
        <button
          type="button"
          onClick={onBackToService}
          className="text-xs font-semibold text-[var(--color-text-primary)] underline cursor-pointer"
        >
          ← Return to Service Selection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
          {currentService.name}
        </div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          What is the scope of this {currentService.name.toLowerCase()} project?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Select the option that best matches your project's starting point and intent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectTypes.map((pt) => {
          const isSelected = brief.projectTypeId === pt.id;

          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => onChange({ projectTypeId: pt.id })}
              aria-pressed={isSelected}
              className={`text-left p-5 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="typo-card-title text-[var(--color-text-primary)]">
                    {pt.name}
                  </h3>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center text-xs shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  {pt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between">
                <span>Scope definition</span>
                <span className={isSelected ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-secondary)] font-medium'}>
                  {isSelected ? 'Selected' : 'Select →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
