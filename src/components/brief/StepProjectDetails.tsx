import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Check } from 'lucide-react';

interface StepProjectDetailsProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
  errors?: Record<string, string | undefined>;
}

export const StepProjectDetails: React.FC<StepProjectDetailsProps> = ({
  brief,
  onChange,
  errors,
}) => {
  const errs: Record<string, string | undefined> = errors || {};
  const industries = taxonomyService.getIndustries();
  const goals = taxonomyService.getProjectGoals();
  const titlePlaceholder = taxonomyService.getProjectTitlePlaceholder(
    brief.serviceId,
    brief.projectTypeId
  );

  const handleToggleGoal = (goalId: string) => {
    const currentGoals = brief.goals || [];
    if (currentGoals.includes(goalId)) {
      onChange({ goals: currentGoals.filter((g) => g !== goalId) });
    } else {
      onChange({ goals: [...currentGoals, goalId] });
    }
  };

  const industryOptions = [
    { value: '', label: 'Select an industry (optional)' },
    ...industries.map((ind) => ({ value: ind.id, label: ind.name })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          Project details & context
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Provide essential context about your business, the challenge, and what a successful outcome looks like.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            id="brief-title"
            label="Project Title"
            placeholder={titlePlaceholder}
            value={brief.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            required
            error={errs.title}
            helperText="A clear, distinctive name for your project brief."
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            id="brief-description"
            label="Project Description"
            placeholder="Describe the context, problem you are solving, core objectives, and what you expect from the professional..."
            value={brief.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            required
            error={errs.description}
            helperText="Include enough context to help vetted practitioners gauge architectural and creative requirements."
          />
        </div>

        <div>
          <Input
            id="brief-business"
            label="Business or Brand Name"
            placeholder="e.g. Acme Studio"
            value={brief.businessName || ''}
            onChange={(e) => onChange({ businessName: e.target.value })}
            helperText="The client organization or brand name."
          />
        </div>

        <div>
          <Input
            id="brief-url"
            label="Current Website or App URL (Optional)"
            placeholder="https://example.com"
            value={brief.existingUrl || ''}
            onChange={(e) => onChange({ existingUrl: e.target.value })}
            error={errs.existingUrl}
            helperText="Leave blank if this is a brand new venture."
          />
        </div>

        <div>
          <Select
            id="brief-industry"
            label="Industry / Domain"
            options={industryOptions}
            value={brief.industryId || ''}
            onChange={(e) => onChange({ industryId: e.target.value })}
          />
        </div>

        {brief.industryId === 'other' && (
          <div>
            <Input
              id="brief-custom-industry"
              label="Specify Custom Industry"
              placeholder="e.g. Sustainable Agritech"
              value={brief.customIndustry || ''}
              onChange={(e) => onChange({ customIndustry: e.target.value })}
            />
          </div>
        )}

        <div className={brief.industryId === 'other' ? 'md:col-span-2' : ''}>
          <Input
            id="brief-target-audience"
            label="Target Audience"
            placeholder="e.g. High-net-worth individuals, European retail consumers"
            value={brief.targetAudience || ''}
            onChange={(e) => onChange({ targetAudience: e.target.value })}
            helperText="Who will be using or purchasing from this solution?"
          />
        </div>
      </div>

      {/* Project Goals */}
      <div className="pt-5 border-t border-[var(--color-border)]">
        <label className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1">
          Primary Project Goals (Select all that apply)
        </label>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
          Identifying your core drivers helps Alongby prioritize matching practitioners with proven domain case studies.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {goals.map((goal) => {
            const isChecked = (brief.goals || []).includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleToggleGoal(goal.id)}
                aria-pressed={isChecked}
                className={`text-left px-3.5 py-2.5 rounded-[var(--radius-button)] border text-[13px] flex items-center justify-between gap-2 transition-colors cursor-pointer min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isChecked
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <span>{goal.name}</span>
                {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>

        {(brief.goals || []).includes('other') && (
          <div className="mt-3">
            <Input
              id="brief-custom-goal"
              label="Specify Other Goal"
              placeholder="e.g. Prepare for Series A technical due diligence"
              value={brief.customGoals || ''}
              onChange={(e) => onChange({ customGoals: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
};
