import React from 'react';
import {
  ProjectBrief,
  TimelineStartOption,
  TimelineDurationOption,
  TimelineFlexibility,
} from '../../types';
import { Input } from '../ui/Input';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

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
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          When would you like to get started?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Alongby matches verified practitioners whose verified capacity matches your targeted timeframe.
        </p>
      </div>

      {/* Section 1: Preferred Start */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider">
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
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-neutral-950 mb-0.5">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {timeline.preferredStart === 'specific_date' && (
          <div className="max-w-xs mt-3">
            <Input
              id="brief-start-date"
              type="date"
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
      <div className="space-y-3 pt-6 border-t border-neutral-100">
        <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider">
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
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-neutral-950 mb-0.5">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {timeline.desiredCompletion === 'specific_date' && (
          <div className="max-w-xs mt-3">
            <Input
              id="brief-completion-date"
              type="date"
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
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Target completion date cannot be earlier than your chosen start date.</span>
          </div>
        )}
      </div>

      {/* Section 3: Timeline Flexibility */}
      <div className="space-y-3 pt-6 border-t border-neutral-100">
        <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider">
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
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                }`}
              >
                <div className="text-xs font-semibold text-neutral-950 mb-0.5">
                  {opt.label}
                </div>
                <div className="text-[11px] text-neutral-500">
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
