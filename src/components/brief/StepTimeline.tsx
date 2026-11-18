import React from 'react';
import {
  ProjectBrief,
  TimelineStartOption,
  TimelineDurationOption,
  TimelineFlexibility,
} from '../../types';
import { DatePicker } from '../ui/DatePicker';
import { Alert } from '../ui/Alert';

interface StepTimelineProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
  errors?: Record<string, string | undefined>;
}

const START_OPTIONS: { id: TimelineStartOption; label: string; description: string }[] = [
  { id: 'asap', label: 'As soon as possible', description: 'Immediate onboarding upon contract signoff' },
  { id: 'two_weeks', label: 'Within 2 weeks', description: 'Standard kickoff window' },
  { id: 'one_month', label: 'Within 1 month', description: 'Planning ahead for next sprint' },
  { id: 'flexible', label: 'Flexible', description: 'Open to professional availability' },
  { id: 'specific_date', label: 'Specific target date', description: 'Pick an exact start date' },
];

const COMPLETION_OPTIONS: { id: TimelineDurationOption; label: string; description: string }[] = [
  { id: 'flexible', label: 'No strict deadline', description: 'Pace guided by milestone depth' },
  { id: 'two_four_weeks', label: '2–4 weeks', description: 'Fast sprint or focused MVP' },
  { id: 'one_two_months', label: '1–2 months', description: 'Typical website, branding, or app MVP' },
  { id: 'two_three_months', label: '2–3 months', description: 'Comprehensive product design & full build' },
  { id: 'three_plus_months', label: '3+ months', description: 'Multi-stage software engineering project' },
  { id: 'specific_date', label: 'Specific deadline', description: 'Hard date (e.g. event or product launch)' },
];

const FLEXIBILITY_OPTIONS: { id: TimelineFlexibility; label: string; description: string }[] = [
  { id: 'fixed', label: 'Fixed deadline', description: 'Strict launch date, cannot slip' },
  { id: 'somewhat_flexible', label: 'Somewhat flexible', description: 'Target date preferred, but quality comes first' },
  { id: 'very_flexible', label: 'Very flexible', description: 'Open to practitioner timeline proposals' },
];

export const StepTimeline: React.FC<StepTimelineProps> = ({
  brief,
  onChange,
  errors,
}) => {
  const errs: Record<string, string | undefined> = errors || {};
  const timeline = brief.timeline || {
    preferredStart: 'asap',
    desiredCompletion: 'flexible',
    flexibility: 'somewhat_flexible',
  };

  const updateTimeline = (patch: Partial<typeof timeline>) => {
    onChange({
      timeline: {
        ...timeline,
        ...patch,
      },
    });
  };

  // Date validation check
  const hasDateConflict =
    timeline.startDate &&
    timeline.completionDate &&
    new Date(timeline.completionDate) < new Date(timeline.startDate);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          When would you like to get started?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Alongby matches verified practitioners whose verified capacity matches your targeted timeframe.
        </p>
      </div>

      {/* Section 1: Preferred Start */}
      <div className="space-y-3">
        <label className="block font-sans text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
          1. Preferred Start
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {START_OPTIONS.map((opt) => {
            const isSelected = timeline.preferredStart === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateTimeline({ preferredStart: opt.id })}
                aria-pressed={isSelected}
                className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
                }`}
              >
                <div>
                  <div className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-0.5 tabular-nums">
                    {opt.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] leading-snug">
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {timeline.preferredStart === 'specific_date' && (
          <div className="max-w-xs mt-3">
            <DatePicker
              id="brief-start-date"
              label="Target Start Date"
              value={timeline.startDate || ''}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => updateTimeline({ startDate: e.target.value })}
              required
              error={errs.startDate}
            />
          </div>
        )}
      </div>

      {/* Section 2: Desired Completion */}
      <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
        <label className="block font-sans text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
          2. Desired Duration / Completion
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPLETION_OPTIONS.map((opt) => {
            const isSelected = timeline.desiredCompletion === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateTimeline({ desiredCompletion: opt.id })}
                aria-pressed={isSelected}
                className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
                }`}
              >
                <div>
                  <div className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-0.5 tabular-nums">
                    {opt.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] leading-snug">
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {timeline.desiredCompletion === 'specific_date' && (
          <div className="max-w-xs mt-3">
            <DatePicker
              id="brief-completion-date"
              label="Target Completion Date"
              value={timeline.completionDate || ''}
              min={timeline.startDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => updateTimeline({ completionDate: e.target.value })}
              required
              error={errs.completionDate}
            />
          </div>
        )}

        {hasDateConflict && (
          <Alert variant="error">
            Target completion date cannot be earlier than your chosen start date.
          </Alert>
        )}
      </div>

      {/* Section 3: Timeline Flexibility */}
      <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
        <label className="block font-sans text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
          3. How flexible is this timeline?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FLEXIBILITY_OPTIONS.map((opt) => {
            const isSelected = timeline.flexibility === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateTimeline({ flexibility: opt.id })}
                aria-pressed={isSelected}
                className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
                }`}
              >
                <div className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-0.5">
                  {opt.label}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
