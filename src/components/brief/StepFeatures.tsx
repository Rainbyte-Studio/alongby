import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Input } from '../ui/Input';
import { Check, Sparkles } from 'lucide-react';

interface StepFeaturesProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
}

export const StepFeatures: React.FC<StepFeaturesProps> = ({ brief, onChange }) => {
  const currentService = taxonomyService.getServiceCategoryById(brief.serviceId);
  const featureOptions = taxonomyService.getFeaturesForService(brief.serviceId);

  const handleToggleFeature = (featureId: string) => {
    const currentFeatures = brief.features || [];
    if (currentFeatures.includes(featureId)) {
      onChange({ features: currentFeatures.filter((f) => f !== featureId) });
    } else {
      onChange({ features: [...currentFeatures, featureId] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
          <span>Service: {currentService?.name || 'General'}</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          What features & deliverables are needed?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Select the capabilities and modules required. Don't worry if you're not sure about everything—proposals will refine this during scope validation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featureOptions.map((feature) => {
          const isSelected = (brief.features || []).includes(feature.id);

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleToggleFeature(feature.id)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-950">
                    {feature.name}
                  </span>
                  {feature.recommended && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Standard
                    </span>
                  )}
                </div>
                {feature.description && (
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {feature.description}
                  </p>
                )}
              </div>

              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-neutral-950 text-white'
                    : 'border border-neutral-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            </button>
          );
        })}
      </div>

      {(brief.features || []).includes('other') && (
        <div className="pt-2">
          <Input
            id="brief-custom-features"
            label="Describe Other Specific Features or Integrations"
            placeholder="e.g. Syncing stock levels with custom SAP ERP backend via WebSockets"
            value={brief.customFeatures || ''}
            onChange={(e) => onChange({ customFeatures: e.target.value })}
            helperText="Specify any proprietary systems, niche APIs, or custom business logic."
          />
        </div>
      )}
    </div>
  );
};
