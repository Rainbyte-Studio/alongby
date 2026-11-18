import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import {
  Globe,
  ShoppingCart,
  Code2,
  Smartphone,
  Palette,
  Sparkles,
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
  branding: Sparkles,
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
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          What type of project do you need?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
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
              className={`text-left p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-neutral-950 text-white'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-neutral-950 mb-1">
                  {service.name}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                <span>{service.projectTypes.length} project types</span>
                <span className="font-medium text-neutral-600">Select →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
