import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Button } from '../ui/Button';
import {
  FileCheck,
  Edit3,
  AlertCircle,
  Clock,
  Euro,
  Layers,
  Sparkles,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';

interface StepReviewProps {
  brief: ProjectBrief;
  onEditSection: (stepNumber: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  validationErrors: string[];
}

function getStepForError(err: string): { step: number; label: string } | null {
  const lower = err.toLowerCase();
  if (lower.includes('service category')) {
    return { step: 1, label: 'Step 1' };
  }
  if (lower.includes('project type')) {
    return { step: 2, label: 'Step 2' };
  }
  if (lower.includes('title') || lower.includes('description') || lower.includes('url')) {
    return { step: 3, label: 'Step 3' };
  }
  if (lower.includes('timeline') || lower.includes('start date') || lower.includes('completion date')) {
    return { step: 6, label: 'Step 6' };
  }
  if (lower.includes('budget')) {
    return { step: 7, label: 'Step 7' };
  }
  return null;
}

export const StepReview: React.FC<StepReviewProps> = ({
  brief,
  onEditSection,
  onSubmit,
  isSubmitting,
  validationErrors,
}) => {
  const service = taxonomyService.getServiceCategoryById(brief.serviceId);
  const projectType = service?.projectTypes.find((pt) => pt.id === brief.projectTypeId);
  const industry = taxonomyService.getIndustries().find((i) => i.id === brief.industryId);
  const goals = taxonomyService.getProjectGoals();
  const allFeatures = taxonomyService.getFeaturesForService(brief.serviceId);
  const allAssets = taxonomyService.getExistingAssets();
  const budgetRange = taxonomyService
    .getBudgetRanges('EUR')
    .find((r) => r.id === brief.budget?.selectedRangeId);

  const formatTimelineStart = () => {
    switch (brief.timeline?.preferredStart) {
      case 'asap':
        return 'As soon as possible';
      case 'two_weeks':
        return 'Within 2 weeks';
      case 'one_month':
        return 'Within 1 month';
      case 'flexible':
        return 'Flexible';
      case 'specific_date':
        return `Target start date: ${brief.timeline.startDate || 'Unspecified'}`;
      default:
        return 'Unspecified';
    }
  };

  const formatTimelineDuration = () => {
    switch (brief.timeline?.desiredCompletion) {
      case 'flexible':
        return 'No strict deadline';
      case 'two_four_weeks':
        return '2–4 weeks sprint';
      case 'one_two_months':
        return '1–2 months';
      case 'two_three_months':
        return '2–3 months';
      case 'three_plus_months':
        return '3+ months';
      case 'specific_date':
        return `Target deadline: ${brief.timeline.completionDate || 'Unspecified'}`;
      default:
        return 'Unspecified';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          Review your project brief
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Review your project scope below. You can jump back to edit any section prior to submission.
        </p>
      </div>

      {/* Validation Errors warning if incomplete */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-[var(--radius-card)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] space-y-2"
        >
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please complete required fields before submitting:</span>
          </div>
          <ul className="space-y-1.5 ml-1">
            {validationErrors.map((err, idx) => {
              const target = getStepForError(err);
              return (
                <li key={idx} className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-start gap-1.5">
                    <span aria-hidden="true">·</span>
                    <span>{err}</span>
                  </div>
                  {target && (
                    <button
                      type="button"
                      onClick={() => onEditSection(target.step)}
                      className="text-xs font-semibold text-[var(--color-error-text)] hover:underline shrink-0 cursor-pointer"
                    >
                      Fix in {target.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Structured Sections */}
      <div className="space-y-4">
        {/* 1. Service & Project Type */}
        <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                1 & 2. Service & Type
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(1)}
              className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                Service Category
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {service?.name || <span className="text-[var(--color-error-text)]">Not selected</span>}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                Project Scope / Type
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {projectType?.name || <span className="text-[var(--color-error-text)]">Not selected</span>}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Project Details */}
        <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                3. Project Details & Goals
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(3)}
              className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="pt-3 space-y-3 text-[13px]">
            <div>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                Project Title
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] text-sm break-words">
                {brief.title || <span className="text-[var(--color-error-text)]">Untitled (Required)</span>}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                Description
              </span>
              <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {brief.description || <span className="text-[var(--color-error-text)]">No description provided</span>}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {brief.businessName && (
                <div>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                    Brand / Business
                  </span>
                  <span className="font-medium text-[var(--color-text-primary)] break-words">
                    {brief.businessName}
                  </span>
                </div>
              )}
              {brief.existingUrl && (
                <div>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                    Existing URL
                  </span>
                  <a
                    href={brief.existingUrl.startsWith('http') ? brief.existingUrl : `https://${brief.existingUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--color-text-primary)] underline truncate block"
                  >
                    {brief.existingUrl}
                  </a>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                  Industry
                </span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {brief.industryId === 'other'
                    ? brief.customIndustry || 'Other Industry'
                    : industry?.name || 'Not specified'}
                </span>
              </div>
            </div>

            {brief.goals && brief.goals.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1.5">
                  Primary Goals
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {brief.goals.map((gId) => {
                    const g = goals.find((item) => item.id === gId);
                    return (
                      <span
                        key={gId}
                        className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs font-medium"
                      >
                        {gId === 'other' && brief.customGoals ? brief.customGoals : g?.name || gId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Features & Scope */}
        <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                4. Features & Deliverables
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(4)}
              className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="pt-3 text-xs">
            {brief.features && brief.features.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {brief.features.map((fId) => {
                  const feat = allFeatures.find((f) => f.id === fId);
                  return (
                    <span
                      key={fId}
                      className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs font-medium"
                    >
                      {fId === 'other' && brief.customFeatures ? brief.customFeatures : feat?.name || fId}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-[var(--color-text-secondary)] italic">
                No specific features selected (General scope)
              </span>
            )}
          </div>
        </div>

        {/* 4. Existing Assets */}
        <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                5. Existing Assets
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(5)}
              className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="pt-3 text-xs">
            {brief.existingAssets && brief.existingAssets.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {brief.existingAssets.map((aId) => {
                  const ast = allAssets.find((a) => a.id === aId);
                  return (
                    <span
                      key={aId}
                      className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs font-medium"
                    >
                      {aId === 'other' && brief.customAssets ? brief.customAssets : ast?.name || aId}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-[var(--color-text-secondary)] italic">
                Starting from scratch (No existing assets)
              </span>
            )}
          </div>
        </div>

        {/* 5. Timeline & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                  6. Timeline
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection(6)}
                className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="pt-3 space-y-2.5 text-[13px] tabular-nums">
              <div>
                <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                  Preferred Start
                </span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {formatTimelineStart()}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                  Desired Completion
                </span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {formatTimelineDuration()}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                  Flexibility
                </span>
                <span className="font-medium capitalize text-[var(--color-text-secondary)]">
                  {brief.timeline?.flexibility?.replace('_', ' ') || 'Somewhat flexible'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                  7. Indicative Budget
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection(7)}
                className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="pt-3 text-[13px]">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
                Indicative Investment Range
              </span>
              <span className="font-sans text-base sm:text-lg font-bold tabular-nums text-[var(--color-text-primary)] block">
                {brief.budget?.budgetType === 'unsure'
                  ? 'I am not sure (Open to proposals)'
                  : budgetRange?.label || '€2,000 – €3,500'}
              </span>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                Non-binding estimate used to curate appropriately priced professionals.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Attachments & Additional Notes */}
        {(brief.additionalDetails || (brief.attachments && brief.attachments.length > 0)) && (
          <div className="p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                  8. Notes & Attachments
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection(8)}
                className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="pt-3 space-y-3 text-xs">
              {brief.additionalDetails && (
                <div>
                  <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                    Additional Notes
                  </span>
                  <p className="text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                    {brief.additionalDetails}
                  </p>
                </div>
              )}

              {brief.attachments && brief.attachments.length > 0 && (
                <div>
                  <span className="text-[var(--color-text-secondary)] font-medium block mb-1">
                    Attached Documents ({brief.attachments.length})
                  </span>
                  <ul className="space-y-1 text-[var(--color-text-primary)]">
                    {brief.attachments.map((att) => (
                      <li key={att.fileId} className="flex items-center gap-1.5">
                        <Paperclip className="w-3 h-3 text-[var(--color-text-secondary)]" />
                        <span className="font-medium">{att.name}</span>
                        <span className="text-[var(--color-text-secondary)] tabular-nums">
                          ({(att.size / 1024).toFixed(0)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submission Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-primary)] text-white space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#C5DBD3] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Ready to submit your project brief?
            </h3>
            <p className="text-xs text-[#E8E5E0] mt-1 leading-relaxed">
              Once submitted, Alongby will review your requirements and start finding suitable professionals. Your brief will be locked after submission.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/15">
          <span className="text-xs text-[#D5D0C9]">
            You'll be notified when your matches are ready.
          </span>

          <Button
            variant="white"
            size="lg"
            onClick={onSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || validationErrors.length > 0}
            className="w-full sm:w-auto font-semibold"
            aria-label="Submit Project Brief"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Project Brief'}
          </Button>
        </div>
      </div>
    </div>
  );
};
