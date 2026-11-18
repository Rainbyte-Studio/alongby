import { ProjectBrief, Money } from '../types';

/**
 * Budget Assessment Service Boundary
 * Prepared for intelligent market pricing assessment in future phases.
 * In Phase 2, this serves as an un-mocked boundary that validates completeness
 * without fabricating false AI price estimates.
 */

export type BudgetAssessmentStatus =
  | 'reasonable'
  | 'potentially_low'
  | 'significantly_low'
  | 'insufficient_data';

export interface BudgetAssessmentResult {
  status: BudgetAssessmentStatus;
  suggestedMin?: Money;
  suggestedMax?: Money;
  currency: string;
  explanation: string;
}

export const budgetAssessmentService = {
  /**
   * Conceptually assesses indicative budget against service scope
   */
  assessBudget(brief: Partial<ProjectBrief>): BudgetAssessmentResult {
    const currency = brief.budget?.currency || 'EUR';

    if (!brief.budget || brief.budget.budgetType === 'unsure') {
      return {
        status: 'insufficient_data',
        currency,
        explanation:
          'Budget is currently unspecified. Alongby curates proposals tailored to your scope during the matching review.',
      };
    }

    const minMinor = brief.budget.minAmountMinor ?? 0;

    // Baseline validation: check if budget floor is below platform minimum (€1,000)
    if (minMinor < 100000) {
      return {
        status: 'potentially_low',
        currency,
        explanation:
          'Alongby engages vetted professionals with a standard minimum project engagement of €1,000.',
      };
    }

    return {
      status: 'reasonable',
      currency,
      explanation:
        'Indicative budget range aligned with vetted professional project baselines.',
    };
  },
};
