import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Check, Sparkles } from 'lucide-react';

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
        <p className="text-sm text-neutral-600 mb-4">
          Please select a primary service category before choosing a project type.
        </p>
        <button
          type="button"
          onClick={onBackToService}
          className="text-xs font-semibold text-neutral-900 underline cursor-pointer"
        >
          ← Return to Service Selection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
          <span>Category: {currentService.name}</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          What is the scope of this {currentService.name.toLowerCase()} project?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
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
              className={`text-left p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {pt.name}
                  </h3>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {pt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Scope definition</span>
                <span className={isSelected ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}>
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
