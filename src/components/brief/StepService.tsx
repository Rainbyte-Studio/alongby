import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import {
  Globe,
  ShoppingCart,
  Code2,
  Smartphone,
  Palette,
  PenTool,
  TrendingUp,
  Search,
  Layers,
  Check,
} from 'lucide-react';

interface StepServiceProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  website: Globe,
  ecommerce: ShoppingCart,
  web_app: Code2,
  mobile_app: Smartphone,
  ui_ux: Palette,
  branding: PenTool,
  digital_marketing: TrendingUp,
  seo: Search,
  other: Layers,
};

export const StepService: React.FC<StepServiceProps> = ({ brief, onChange }) => {
  const services = taxonomyService.getServiceCategories();

  const handleSelectService = (serviceId: string) => {
    if (brief.serviceId === serviceId) return;

    // Reset projectTypeId and features if changing service category
    onChange({
      serviceId,
      projectTypeId: '',
      features: [],
      customFeatures: '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          What type of project do you need?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Select the primary service discipline. You will be able to refine specific project types and feature requirements in the next steps.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const isSelected = brief.serviceId === service.id;
          const Icon = SERVICE_ICONS[service.slug] || Layers;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelectService(service.id)}
              aria-pressed={isSelected}
              className={`text-left p-5 rounded-[var(--radius-card)] border transition-colors cursor-pointer relative flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-[var(--radius-button)] flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                        : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <h3 className="typo-card-title text-[var(--color-text-primary)] mb-1">
                  {service.name}
                </h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)] tabular-nums">
                <span>{service.projectTypes.length} project types</span>
                <span className={`font-semibold ${isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
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
