import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Input } from '../ui/Input';
import { Check } from 'lucide-react';

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
        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
          {currentService?.name || 'General'}
        </div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          What features & deliverables are needed?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
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
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold text-[var(--color-text-primary)]">
                    {feature.name}
                  </span>
                  {feature.recommended && (
                    <span className="text-xs font-medium text-[var(--color-warning-text)]">
                      · Recommended
                    </span>
                  )}
                </div>
                {feature.description && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    {feature.description}
                  </p>
                )}
              </div>

              <div
                className={`w-4 h-4 rounded-[4px] mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                    : 'border border-[var(--color-border-strong)] bg-[var(--color-surface)]'
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
