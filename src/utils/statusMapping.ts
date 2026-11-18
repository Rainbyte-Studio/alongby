import {
  BudgetRelation,
  OpportunityStatus,
  ProjectBudget,
  ProjectState,
} from '../types';
import { BadgeVariant } from '../components/ui/Badge';

export interface ClientProjectStatusDisplay {
  label: string;
  badgeText: string;
  badgeVariant: BadgeVariant;
  headline: string;
  description: string;
  isMatchingStage?: boolean;
  requiresClientAction?: boolean;
  actionLabel?: string;
}

export interface ProjectLifecycleStage {
  id: string;
  label: string;
}

export const CLIENT_LIFECYCLE_STAGES: ProjectLifecycleStage[] = [
  { id: 'brief', label: 'Brief Submitted' },
  { id: 'matching', label: 'Curation & Matching' },
  { id: 'shortlist', label: 'Shortlist Review' },
  { id: 'proposal', label: 'Commercial Proposal' },
  { id: 'agreement', label: 'Service Agreement' },
  { id: 'delivery', label: 'Project Delivery' },
];

/**
 * Returns the 0-based active stage index in CLIENT_LIFECYCLE_STAGES for non-draft projects.
 */
export function getClientLifecycleStageIndex(status: ProjectState | string): number {
  switch (status) {
    case 'draft':
      return 0;
    case 'submitted':
    case 'budget_review':
    case 'matching':
    case 'awaiting_professional_responses':
    case 'shortlist_review':
      return 1;
    case 'shortlist_ready':
      return 2;
    case 'professional_selected':
    case 'proposal_pending':
      return 3;
    case 'proposal_accepted':
    case 'contract_pending':
    case 'awaiting_signatures':
      return 4;
    case 'awaiting_deposit':
    case 'active_phase_1':
    case 'phase_1_review':
    case 'awaiting_final_payment':
    case 'active_phase_2':
    case 'final_review':
    case 'completed':
      return 5;
    default:
      return 1;
  }
}

/**
 * Authoritative client-facing status representation mapping.
 * Translates internal lifecycle state machine values into calm, accurate client language.
 * Does NOT alter persisted lifecycle states.
 */
export function getClientProjectStatusDisplay(
  status: ProjectState | string,
  submittedAt?: string
): ClientProjectStatusDisplay {
  const formattedDate = submittedAt ? new Date(submittedAt).toLocaleDateString() : 'recently';

  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        badgeText: 'Draft',
        badgeVariant: 'warning',
        headline: 'Draft in Progress',
        description:
          'This project brief has not yet been submitted. Resume editing to complete and submit your requirements.',
        requiresClientAction: true,
        actionLabel: 'Continue Brief',
      };

    case 'submitted':
    case 'budget_review':
    case 'matching':
      return {
        label: 'Matching in progress',
        badgeText: 'Matching in progress',
        badgeVariant: 'info',
        headline: "We're finding the right professionals",
        description: `Your brief was submitted on ${formattedDate}. Alongby is reviewing your requirements and identifying verified professionals suited to your scope.`,
        isMatchingStage: true,
      };

    case 'awaiting_professional_responses':
    case 'shortlist_review':
      return {
        label: 'Matching in progress',
        badgeText: 'Matching in progress',
        badgeVariant: 'info',
        headline: 'Professionals are reviewing your project',
        description:
          'Matched specialists have been privately invited to review your brief and submit structured commercial quotes.',
        isMatchingStage: true,
      };

    case 'shortlist_ready':
      return {
        label: 'Your matches are ready',
        badgeText: 'Matches ready',
        badgeVariant: 'success',
        headline: 'Your curated professional shortlist is ready',
        description:
          'Compare verified specialists, commercial quotes, included deliverables, and proposed timelines side by side to select your preferred partner.',
        requiresClientAction: true,
        actionLabel: 'View Your Matches',
      };

    case 'professional_selected':
      return {
        label: 'Professional selected',
        badgeText: 'Professional selected',
        badgeVariant: 'success',
        headline: 'Selection Confirmed',
        description:
          'You have confirmed your chosen specialist. Review the itemized commercial proposal and milestone schedule next.',
        requiresClientAction: true,
        actionLabel: 'Review Proposal',
      };

    case 'proposal_pending':
      return {
        label: 'Proposal ready for review',
        badgeText: 'Proposal review',
        badgeVariant: 'info',
        headline: 'Commercial Proposal Ready for Review',
        description:
          'The formal proposal detailing scope of work, deliverables, staged payment terms, and revision allowances is ready for review.',
        requiresClientAction: true,
        actionLabel: 'Review Proposal',
      };

    case 'proposal_accepted':
      return {
        label: 'Proposal accepted',
        badgeText: 'Proposal accepted',
        badgeVariant: 'success',
        headline: 'Proposal Accepted — Agreement Ready',
        description:
          'Both parties aligned on commercial scope and milestones. Proceed to review and sign the service agreement.',
        requiresClientAction: true,
        actionLabel: 'Review Agreement',
      };

    case 'contract_pending':
    case 'awaiting_signatures':
      return {
        label: 'Agreement awaiting signatures',
        badgeText: 'Awaiting signatures',
        badgeVariant: 'warning',
        headline: 'Service Agreement Awaiting Signatures',
        description:
          'The commercial proposal has been accepted. Review the formal service agreement clauses and complete dual-party acceptance.',
        requiresClientAction: true,
        actionLabel: 'Review & Sign Agreement',
      };

    case 'awaiting_deposit':
      return {
        label: 'Awaiting initial deposit',
        badgeText: 'Awaiting deposit',
        badgeVariant: 'warning',
        headline: 'Agreement Signed — Awaiting Phase 1 Deposit Confirmation',
        description:
          'Both parties have signed the service agreement. Project delivery begins only after the Phase 1 deposit stage is confirmed.',
        actionLabel: 'View Agreement',
      };

    case 'active_phase_1':
      return {
        label: 'Phase 1 in progress',
        badgeText: 'Phase 1 active',
        badgeVariant: 'success',
        headline: 'Phase 1 Delivery Active',
        description:
          'Your selected professional is actively delivering Phase 1 milestones under your executed agreement.',
      };

    case 'phase_1_review':
      return {
        label: 'Phase 1 in review',
        badgeText: 'Phase 1 review',
        badgeVariant: 'info',
        headline: 'Phase 1 Deliverables Ready for Review',
        description:
          'Phase 1 deliverables have been submitted against the agreed acceptance criteria.',
        requiresClientAction: true,
        actionLabel: 'View Project',
      };

    case 'awaiting_final_payment':
      return {
        label: 'Awaiting completion-stage payment',
        badgeText: 'Awaiting Phase 2 payment',
        badgeVariant: 'warning',
        headline: 'Awaiting Completion-Stage Payment Confirmation',
        description:
          'Phase 1 review is complete. Phase 2 milestone work begins once the second payment stage is confirmed.',
      };

    case 'active_phase_2':
      return {
        label: 'Phase 2 in progress',
        badgeText: 'Phase 2 active',
        badgeVariant: 'success',
        headline: 'Phase 2 Delivery Active',
        description:
          'Your selected professional is actively completing Phase 2 final deliverables.',
      };

    case 'final_review':
      return {
        label: 'Final review',
        badgeText: 'Final review',
        badgeVariant: 'info',
        headline: 'Final Deliverables Ready for Sign-Off',
        description:
          'All project deliverables have been submitted for final inspection and acceptance.',
        requiresClientAction: true,
        actionLabel: 'View Project',
      };

    case 'completed':
      return {
        label: 'Completed',
        badgeText: 'Completed',
        badgeVariant: 'success',
        headline: 'Project Completed',
        description: 'All agreed deliverables and project stages have been completed.',
      };

    case 'paused':
      return {
        label: 'Paused',
        badgeText: 'Paused',
        badgeVariant: 'neutral',
        headline: 'Project Paused',
        description: 'This engagement is currently paused.',
      };

    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeText: 'Cancelled',
        badgeVariant: 'danger',
        headline: 'Project Cancelled',
        description: 'This project has been cancelled and closed.',
      };

    case 'disputed':
      return {
        label: 'Under review',
        badgeText: 'In dispute',
        badgeVariant: 'danger',
        headline: 'Engagement Under Administrative Review',
        description: 'This engagement is currently under review by Alongby support.',
      };

    default:
      return {
        label: 'In progress',
        badgeText: 'In progress',
        badgeVariant: 'info',
        headline: 'Project Active',
        description: 'Your project is currently progressing through the Alongby workflow.',
      };
  }
}

/**
 * Operational admin-facing status mapping with crisp, consistent labels.
 */
export function getAdminProjectStatusDisplay(status: ProjectState | string): {
  label: string;
  variant: BadgeVariant;
  needsAdminAction: boolean;
} {
  switch (status) {
    case 'draft':
      return { label: 'Client Draft', variant: 'neutral', needsAdminAction: false };
    case 'submitted':
      return { label: 'Submitted · Run Matching', variant: 'warning', needsAdminAction: true };
    case 'budget_review':
      return { label: 'Budget Review', variant: 'warning', needsAdminAction: true };
    case 'matching':
      return { label: 'Matching · Dispatch Opps', variant: 'info', needsAdminAction: true };
    case 'awaiting_professional_responses':
      return { label: 'Awaiting Quotes', variant: 'info', needsAdminAction: false };
    case 'shortlist_review':
      return { label: 'Shortlist Curation', variant: 'warning', needsAdminAction: true };
    case 'shortlist_ready':
      return { label: 'Shortlist Published', variant: 'success', needsAdminAction: false };
    case 'professional_selected':
      return { label: 'Specialist Selected', variant: 'success', needsAdminAction: false };
    case 'proposal_pending':
      return { label: 'Proposal Review', variant: 'info', needsAdminAction: false };
    case 'proposal_accepted':
      return { label: 'Proposal Accepted', variant: 'success', needsAdminAction: false };
    case 'contract_pending':
    case 'awaiting_signatures':
      return { label: 'Awaiting Signatures', variant: 'warning', needsAdminAction: false };
    case 'awaiting_deposit':
      return { label: 'Awaiting Phase 1 Deposit', variant: 'warning', needsAdminAction: false };
    case 'active_phase_1':
      return { label: 'Phase 1 Active', variant: 'success', needsAdminAction: false };
    case 'phase_1_review':
      return { label: 'Phase 1 Review', variant: 'info', needsAdminAction: false };
    case 'awaiting_final_payment':
      return { label: 'Awaiting Phase 2 Deposit', variant: 'warning', needsAdminAction: false };
    case 'active_phase_2':
      return { label: 'Phase 2 Active', variant: 'success', needsAdminAction: false };
    case 'final_review':
      return { label: 'Final Review', variant: 'info', needsAdminAction: false };
    case 'completed':
      return { label: 'Completed', variant: 'success', needsAdminAction: false };
    case 'paused':
      return { label: 'Paused', variant: 'neutral', needsAdminAction: false };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'danger', needsAdminAction: false };
    case 'disputed':
      return { label: 'Disputed · Escalated', variant: 'danger', needsAdminAction: true };
    default:
      return {
        label: status.replace(/_/g, ' '),
        variant: 'neutral',
        needsAdminAction: false,
      };
  }
}

/**
 * Professional-facing opportunity status display mapping.
 */
export function getOpportunityStatusDisplay(status: OpportunityStatus | string): {
  label: string;
  variant: BadgeVariant;
  actionRequired: boolean;
} {
  switch (status) {
    case 'pending':
      return { label: 'New Invitation', variant: 'warning', actionRequired: true };
    case 'viewed':
      return { label: 'Awaiting Your Quote', variant: 'info', actionRequired: true };
    case 'interested':
      return { label: 'Quote Submitted', variant: 'success', actionRequired: false };
    case 'alternative_proposal':
      return { label: 'Alternative Quote Sent', variant: 'info', actionRequired: false };
    case 'selected':
      return { label: 'Selected by Client', variant: 'success', actionRequired: false };
    case 'not_selected':
      return { label: 'Closed · Another Selected', variant: 'neutral', actionRequired: false };
    case 'passed':
      return { label: 'Declined', variant: 'neutral', actionRequired: false };
    case 'expired':
      return { label: 'Expired', variant: 'neutral', actionRequired: false };
    case 'withdrawn':
      return { label: 'Withdrawn', variant: 'neutral', actionRequired: false };
    default:
      return { label: status.replace(/_/g, ' '), variant: 'neutral', actionRequired: false };
  }
}

/**
 * Human-readable budget fit label & badge variant.
 */
export function getBudgetRelationDisplay(relation: BudgetRelation | string): {
  label: string;
  variant: BadgeVariant;
} {
  switch (relation) {
    case 'within_budget':
      return { label: 'Within indicative budget', variant: 'success' };
    case 'slightly_above':
      return { label: 'Slightly above range', variant: 'warning' };
    case 'materially_above':
      return { label: 'Above indicative range', variant: 'neutral' };
    default:
      return { label: relation.replace(/_/g, ' '), variant: 'neutral' };
  }
}

/**
 * Consistent formatting for ProjectBudget across Client, Professional, and Admin views.
 */
export function formatProjectBudget(
  budget?: ProjectBudget,
  rangeLabelLookup?: (rangeId: string) => string | undefined
): string {
  if (!budget || budget.budgetType === 'unsure') {
    return 'Open to proposals';
  }
  if (budget.selectedRangeId && rangeLabelLookup) {
    const label = rangeLabelLookup(budget.selectedRangeId);
    if (label) return label;
  }
  const currencySymbol = budget.currency === 'EUR' || !budget.currency ? '€' : `${budget.currency} `;
  const min = typeof budget.minAmountMinor === 'number' ? Math.round(budget.minAmountMinor / 100) : null;
  const max = typeof budget.maxAmountMinor === 'number' ? Math.round(budget.maxAmountMinor / 100) : null;

  if (min !== null && max !== null) {
    return `${currencySymbol}${min.toLocaleString()} – ${currencySymbol}${max.toLocaleString()}`;
  }
  if (min !== null && budget.maxAmountMinor === null) {
    return `${currencySymbol}${min.toLocaleString()}+`;
  }
  return 'Indicative range set';
}

/**
 * Transforms internal enum values for timeline preferences into clean display labels.
 * Persisted enum values remain unchanged.
 */
export function formatTimelineOption(value?: string): string {
  if (!value) return 'Flexible';

  const mapping: Record<string, string> = {
    asap: 'As soon as possible',
    two_weeks: 'Within 2 weeks',
    one_month: 'Within 1 month',
    flexible: 'Flexible',
    somewhat_flexible: 'Somewhat flexible',
    very_flexible: 'Very flexible',
    fixed: 'Fixed deadline',
    strict: 'Strict',
    firm: 'Firm',
    hard_deadline: 'Firm deadline',
    specific_date: 'Specific date',
    two_four_weeks: '2–4 weeks',
    one_two_months: '1–2 months',
    two_three_months: '2–3 months',
    three_plus_months: '3+ months',
    within_1_month: 'Within 1 month',
    within_3_months: 'Within 3 months',
    within_6_months: 'Within 6 months',
  };

  const key = value.toLowerCase();
  if (mapping[key]) {
    return mapping[key];
  }

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format activity log messages for client-facing presentation.
 * Strips technical implementation details and normalizes to product-facing copy.
 */
export function formatActivityDisplay(text?: string): string {
  if (!text) return '';

  if (
    text.includes('curated matching review') ||
    text.includes('algorithmic matching') ||
    text.includes('initiating algorithmic')
  ) {
    return 'Your project brief was submitted and matching has started.';
  }

  if (text.includes('Initial project brief draft initiated')) {
    return 'Project brief draft started.';
  }

  return text.replace(/\(snapshot v\d+\)/gi, '').trim();
}
