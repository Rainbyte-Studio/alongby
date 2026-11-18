import { ProjectState } from '../types';

export interface ClientProjectStatusDisplay {
  label: string;
  badgeText: string;
  badgeVariant: 'neutral' | 'warning' | 'info' | 'success' | 'danger';
  headline: string;
  description: string;
  isMatchingStage?: boolean;
}

/**
 * Authoritative client-facing status representation mapping.
 * Translates internal lifecycle state machine values into calm, professional client language.
 * Does NOT alter persisted lifecycle states.
 */
export function getClientProjectStatusDisplay(
  status: ProjectState | string,
  submittedAt?: string
): ClientProjectStatusDisplay {
  const formattedDate = submittedAt ? new Date(submittedAt).toLocaleDateString() : 'today';

  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        badgeText: 'Draft',
        badgeVariant: 'warning',
        headline: 'Draft in Progress',
        description: 'This project has not yet been submitted. Resume editing to complete your brief.',
      };

    case 'submitted':
    case 'budget_review':
    case 'matching':
      return {
        label: 'Matching in progress',
        badgeText: 'Matching in progress',
        badgeVariant: 'info',
        headline: "We're finding the right professionals",
        description: `Your brief was submitted on ${formattedDate}. Alongby is reviewing your requirements and finding professionals who match your project.`,
        isMatchingStage: true,
      };

    case 'awaiting_professional_responses':
    case 'shortlist_review':
      return {
        label: 'Matching in progress',
        badgeText: 'Matching in progress',
        badgeVariant: 'info',
        headline: 'Professionals are reviewing your project',
        description: 'Matched professionals have been invited to review your project brief. We will notify you once responses have been curated.',
        isMatchingStage: true,
      };

    case 'shortlist_ready':
      return {
        label: 'Your matches are ready',
        badgeText: 'Matches ready',
        badgeVariant: 'success',
        headline: 'Your curated professional shortlist is ready',
        description: 'Our curation team has hand-picked verified specialists matched to your project. Compare their quotes, scopes, and availability, and choose your preferred partner.',
      };

    case 'professional_selected':
      return {
        label: 'Professional selected',
        badgeText: 'Professional selected',
        badgeVariant: 'success',
        headline: 'Selection Confirmed',
        description: 'You have confirmed your chosen specialist. Proceed to inspect itemized deliverables and the commercial proposal.',
      };

    case 'proposal_pending':
      return {
        label: 'Proposal in progress',
        badgeText: 'Proposal in progress',
        badgeVariant: 'info',
        headline: 'Commercial Proposal Ready for Review',
        description: 'The formal proposal detailing deliverables, milestone splits, and revision terms is ready for your review.',
      };

    case 'proposal_accepted':
      return {
        label: 'Proposal accepted',
        badgeText: 'Proposal accepted',
        badgeVariant: 'success',
        headline: 'Proposal Accepted',
        description: 'The proposal was accepted. The master services agreement is being prepared for digital execution.',
      };

    case 'contract_pending':
    case 'awaiting_signatures':
      return {
        label: 'Contract awaiting signatures',
        badgeText: 'Contract awaiting signatures',
        badgeVariant: 'warning',
        headline: 'Master Services Agreement Awaiting Signature',
        description: 'The proposal was formally accepted. Complete electronic execution under standard contractual terms.',
      };

    case 'awaiting_deposit':
      return {
        label: 'Awaiting first payment',
        badgeText: 'Awaiting first payment',
        badgeVariant: 'warning',
        headline: 'Awaiting Phase 1 Initial Deposit',
        description: 'Both parties have signed the agreement. Project work will activate upon funding the Phase 1 initial deposit (50% upfront deposit).',
      };

    case 'active_phase_1':
      return {
        label: 'Phase 1 in progress',
        badgeText: 'Phase 1 in progress',
        badgeVariant: 'success',
        headline: 'Phase 1 Active',
        description: 'Your matched professional is actively working on Phase 1 deliverables.',
      };

    case 'phase_1_review':
      return {
        label: 'Phase 1 in review',
        badgeText: 'Phase 1 review',
        badgeVariant: 'info',
        headline: 'Phase 1 Deliverables Ready for Review',
        description: 'Phase 1 deliverables have been submitted for your review and feedback.',
      };

    case 'awaiting_final_payment':
      return {
        label: 'Awaiting final payment',
        badgeText: 'Awaiting final payment',
        badgeVariant: 'warning',
        headline: 'Awaiting Phase 2 Deposit',
        description: 'Phase 1 is complete. Fund the final milestone deposit to initiate Phase 2.',
      };

    case 'active_phase_2':
      return {
        label: 'Phase 2 in progress',
        badgeText: 'Phase 2 in progress',
        badgeVariant: 'success',
        headline: 'Phase 2 Active',
        description: 'Your matched professional is actively working on Phase 2 milestone deliverables.',
      };

    case 'final_review':
      return {
        label: 'Final review',
        badgeText: 'Final review',
        badgeVariant: 'info',
        headline: 'Final Deliverables Ready for Review',
        description: 'The completed project deliverables are ready for your final sign-off.',
      };

    case 'completed':
      return {
        label: 'Completed',
        badgeText: 'Completed',
        badgeVariant: 'success',
        headline: 'Project Completed',
        description: 'All milestone phases have been completed and approved.',
      };

    case 'paused':
      return {
        label: 'Paused',
        badgeText: 'Paused',
        badgeVariant: 'neutral',
        headline: 'Project Paused',
        description: 'This project is currently paused.',
      };

    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeText: 'Cancelled',
        badgeVariant: 'danger',
        headline: 'Project Cancelled',
        description: 'This project has been cancelled.',
      };

    case 'disputed':
      return {
        label: 'In dispute',
        badgeText: 'In dispute',
        badgeVariant: 'danger',
        headline: 'Project in Dispute',
        description: 'This project is currently under review by Alongby mediation support.',
      };

    default:
      return {
        label: 'Matching in progress',
        badgeText: 'Matching in progress',
        badgeVariant: 'info',
        headline: 'Project Active',
        description: 'Your project is active.',
      };
  }
}

/**
 * Transforms internal enum values for timeline preferences into clean, client-facing display labels.
 * Persisted enum values remain unchanged.
 */
export function formatTimelineOption(value?: string): string {
  if (!value) return 'Flexible';

  const mapping: Record<string, string> = {
    asap: 'As soon as possible',
    flexible: 'Flexible',
    somewhat_flexible: 'Somewhat flexible',
    very_flexible: 'Very flexible',
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

  // Fallback: title-case words separated by underscores
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

  // Remove internal snapshot version annotations like (snapshot v1)
  return text.replace(/\(snapshot v\d+\)/gi, '').trim();
}
