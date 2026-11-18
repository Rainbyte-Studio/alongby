import {
  Project,
  ProjectMatch,
  Opportunity,
  Quote,
  ProfessionalProfile,
  ProfessionalAvailability,
  ShortlistEligibilityResult,
  UserProfile,
} from '../types';

export interface ShortlistCandidateContext {
  project: Project;
  candidate: ProjectMatch;
  opportunity: Opportunity;
  quote?: Quote | null;
  professional: ProfessionalProfile;
  availability: ProfessionalAvailability | null;
  userAccount?: UserProfile | null;
}

export const shortlistEligibilityService = {
  /**
   * Evaluate if a professional candidate is eligible for inclusion in a client shortlist
   */
  evaluateEligibility(context: ShortlistCandidateContext): ShortlistEligibilityResult {
    const {
      project,
      candidate,
      opportunity,
      quote,
      professional,
      availability,
      userAccount,
    } = context;

    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Consistency check: Project association
    if (
      opportunity.projectId !== project.id ||
      candidate.projectId !== project.id ||
      (quote && quote.projectId !== project.id)
    ) {
      return {
        eligible: false,
        reasons: ['Record mismatch: Opportunity or Quote does not belong to this project brief.'],
        warnings,
      };
    }

    // 2. Identity consistency
    if (
      opportunity.professionalId !== professional.userId ||
      candidate.professionalId !== professional.userId ||
      (quote && quote.professionalId !== professional.userId)
    ) {
      return {
        eligible: false,
        reasons: ['Identity mismatch: Record professional identifier does not match candidate.'],
        warnings,
      };
    }

    // 3. Account status (Active vs. Suspended / Disabled)
    if (userAccount) {
      if (userAccount.accountStatus === 'suspended') {
        return {
          eligible: false,
          reasons: ['Professional account is currently suspended.'],
          warnings,
        };
      }
      if (userAccount.accountStatus === 'disabled') {
        return {
          eligible: false,
          reasons: ['Professional account is disabled.'],
          warnings,
        };
      }
    }

    // 4. Professional verification status
    if (professional.verificationStatus !== 'verified') {
      return {
        eligible: false,
        reasons: [
          `Professional verification status is '${professional.verificationStatus}', but 'verified' is strictly required for client shortlist presentation.`,
        ],
        warnings,
      };
    }

    // 5. Positive Opportunity Response Check
    const hasPositiveStatus =
      opportunity.status === 'interested' ||
      opportunity.status === 'alternative_proposal' ||
      opportunity.status === 'selected';

    const hasPositiveResponseType =
      opportunity.responseType === 'standard_quote' ||
      opportunity.responseType === 'alternative_proposal';

    if (opportunity.status === 'passed' || opportunity.responseType === 'pass') {
      return {
        eligible: false,
        reasons: [
          `Professional declined/passed on this opportunity (${opportunity.passReason || 'not available'}).`,
        ],
        warnings,
      };
    }

    if (opportunity.status === 'pending' || opportunity.status === 'viewed') {
      return {
        eligible: false,
        reasons: ['Opportunity is awaiting professional response; no commercial proposal submitted yet.'],
        warnings,
      };
    }

    if (!hasPositiveStatus && !hasPositiveResponseType) {
      return {
        eligible: false,
        reasons: [`Opportunity status is '${opportunity.status}', not a positive commercial proposal.`],
        warnings,
      };
    }

    // 6. Quote presence and validity
    if (!quote) {
      return {
        eligible: false,
        reasons: ['No submitted quote found for this opportunity.'],
        warnings,
      };
    }

    if (quote.status === 'withdrawn') {
      return {
        eligible: false,
        reasons: ['Professional withdrew this commercial proposal.'],
        warnings,
      };
    }

    if (quote.status === 'expired') {
      return {
        eligible: false,
        reasons: ['Quote validity period has expired.'],
        warnings,
      };
    }

    if (quote.status !== 'submitted' && quote.status !== 'selected') {
      return {
        eligible: false,
        reasons: [`Quote is in invalid state '${quote.status}' (must be 'submitted').`],
        warnings,
      };
    }

    if (quote.amountMinor <= 0) {
      return {
        eligible: false,
        reasons: ['Quote commercial amount must be greater than zero.'],
        warnings,
      };
    }

    // 7. Availability check
    if (availability) {
      if (availability.availabilityStatus === 'unavailable') {
        return {
          eligible: false,
          reasons: ['Professional availability is marked as unavailable.'],
          warnings,
        };
      }
      if (availability.availabilityStatus === 'fully_booked') {
        warnings.push('Professional is currently at full concurrent project capacity.');
      } else if (availability.availabilityStatus === 'limited') {
        warnings.push('Professional has limited capacity window.');
      }
    }

    // 8. Budget Warnings
    if (quote.budgetRelation === 'materially_above') {
      warnings.push(
        'Proposal price is noticeably above the client’s indicative initial budget range.'
      );
    }

    // 9. Alternative Proposal Warning
    if (quote.quoteType === 'alternative') {
      warnings.push(
        'Professional has submitted an Alternative Proposal with adjusted scope or timeline.'
      );
    }

    // Success: passed all strict eligibility criteria
    reasons.push('Verified active professional profile');
    reasons.push('Positive commercial proposal received');
    reasons.push(
      quote.quoteType === 'alternative'
        ? 'Alternative proposal with customized scope and timeline'
        : 'Standard commercial quote submitted within scope'
    );

    return {
      eligible: true,
      reasons,
      warnings,
    };
  },
};
