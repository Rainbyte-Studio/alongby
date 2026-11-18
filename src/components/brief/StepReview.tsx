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
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          Review your project brief
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Review your project scope below. You can jump back to edit any section prior to submission.
        </p>
      </div>

      {/* Validation Errors warning if incomplete */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2"
        >
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>Please complete required fields before submitting:</span>
          </div>
          <ul className="space-y-1.5 text-rose-700 ml-1">
            {validationErrors.map((err, idx) => {
              const target = getStepForError(err);
              return (
                <li key={idx} className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-start gap-1.5">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{err}</span>
                  </div>
                  {target && (
                    <button
                      type="button"
                      onClick={() => onEditSection(target.step)}
                      className="text-xs font-semibold text-rose-800 hover:text-rose-950 underline shrink-0 cursor-pointer"
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
        <div className="p-5 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                1 & 2. Service & Type
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(1)}
              className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-400 block mb-0.5">Service Category</span>
              <span className="font-semibold text-neutral-900">
                {service?.name || <span className="text-rose-600">Not selected</span>}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Project Scope / Type</span>
              <span className="font-semibold text-neutral-900">
                {projectType?.name || <span className="text-rose-600">Not selected</span>}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Project Details */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                3. Project Details & Goals
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(3)}
              className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="pt-3 space-y-3 text-xs">
            <div>
              <span className="text-neutral-400 block mb-0.5">Project Title</span>
              <span className="font-semibold text-neutral-900 text-sm">
                {brief.title || <span className="text-rose-600">Untitled (Required)</span>}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block mb-0.5">Description</span>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {brief.description || <span className="text-rose-600">No description provided</span>}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {brief.businessName && (
                <div>
                  <span className="text-neutral-400 block mb-0.5">Brand / Business</span>
                  <span className="font-medium text-neutral-800">{brief.businessName}</span>
                </div>
              )}
              {brief.existingUrl && (
                <div>
                  <span className="text-neutral-400 block mb-0.5">Existing URL</span>
                  <a
                    href={brief.existingUrl.startsWith('http') ? brief.existingUrl : `https://${brief.existingUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-neutral-900 underline truncate block"
                  >
                    {brief.existingUrl}
                  </a>
                </div>
              )}
              <div>
                <span className="text-neutral-400 block mb-0.5">Industry</span>
                <span className="font-medium text-neutral-800">
                  {brief.industryId === 'other'
                    ? brief.customIndustry || 'Other Industry'
                    : industry?.name || 'Not specified'}
                </span>
              </div>
            </div>

            {brief.goals && brief.goals.length > 0 && (
              <div className="pt-2">
                <span className="text-neutral-400 block mb-1">Primary Goals</span>
                <div className="flex flex-wrap gap-1.5">
                  {brief.goals.map((gId) => {
                    const g = goals.find((item) => item.id === gId);
                    return (
                      <span
                        key={gId}
                        className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[11px] font-medium"
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
        <div className="p-5 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                4. Features & Deliverables
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(4)}
              className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
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
                      className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium"
                    >
                      {fId === 'other' && brief.customFeatures ? brief.customFeatures : feat?.name || fId}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-neutral-400 italic">No specific features selected (General scope)</span>
            )}
          </div>
        </div>

        {/* 4. Existing Assets */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                5. Existing Assets
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(5)}
              className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
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
                      className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-900 text-xs font-medium"
                    >
                      {aId === 'other' && brief.customAssets ? brief.customAssets : ast?.name || aId}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-neutral-400 italic">Starting from scratch (No existing assets)</span>
            )}
          </div>
        </div>

        {/* 5. Timeline & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  6. Timeline
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection(6)}
                className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="pt-3 space-y-2 text-xs">
              <div>
                <span className="text-neutral-400 block">Preferred Start:</span>
                <span className="font-semibold text-neutral-900">{formatTimelineStart()}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Desired Completion:</span>
                <span className="font-semibold text-neutral-900">{formatTimelineDuration()}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Flexibility:</span>
                <span className="font-medium capitalize text-neutral-700">
                  {brief.timeline?.flexibility?.replace('_', ' ') || 'Somewhat flexible'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  7. Indicative Budget
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection(7)}
                className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="pt-3 text-xs">
              <span className="text-neutral-400 block mb-0.5">Indicative Investment Range</span>
              <span className="text-base font-serif font-bold text-neutral-950 block">
                {brief.budget?.budgetType === 'unsure'
                  ? 'I am not sure (Open to proposals)'
                  : budgetRange?.label || '€2,000 – €3,500'}
              </span>
              <p className="text-[11px] text-neutral-500 mt-2">
                Non-binding estimate used to curate appropriately priced professionals.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Attachments & Additional Notes */}
        {(brief.additionalDetails || (brief.attachments && brief.attachments.length > 0)) && (
          <div className="p-5 rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  8. Notes & Attachments
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditSection(8)}
                className="text-xs font-medium text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="pt-3 space-y-3 text-xs">
              {brief.additionalDetails && (
                <div>
                  <span className="text-neutral-400 block mb-0.5">Additional Notes</span>
                  <p className="text-neutral-700 whitespace-pre-wrap">{brief.additionalDetails}</p>
                </div>
              )}

              {brief.attachments && brief.attachments.length > 0 && (
                <div>
                  <span className="text-neutral-400 block mb-1">
                    Attached Documents ({brief.attachments.length})
                  </span>
                  <ul className="space-y-1 text-neutral-700">
                    {brief.attachments.map((att) => (
                      <li key={att.fileId} className="flex items-center gap-1.5">
                        <Paperclip className="w-3 h-3 text-neutral-400" />
                        <span className="font-medium">{att.name}</span>
                        <span className="text-neutral-400">
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
      <div className="p-6 rounded-xl bg-neutral-900 text-white space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Ready to submit your project brief?
            </h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Once submitted, Alongby will review your requirements and start finding suitable professionals. Your brief will be locked after submission.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <span className="text-[11px] text-neutral-400">
            You'll be notified when your matches are ready.
          </span>

          <Button
            variant="secondary"
            size="lg"
            onClick={onSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || validationErrors.length > 0}
            className="w-full sm:w-auto font-medium"
            aria-label="Submit Project Brief"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Project Brief'}
          </Button>
        </div>
      </div>
    </div>
  );
};
