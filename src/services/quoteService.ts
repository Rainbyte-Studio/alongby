import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Quote,
  QuoteType,
  BudgetRelation,
  ProjectBudget,
} from '../types';
import { opportunityService } from './opportunityService';
import { matchingService } from './matchingService';
import { projectService } from './projectService';
import { auditService } from './auditService';

export interface SubmitQuoteInput {
  opportunityId: string;
  quoteType: QuoteType;
  amountMinor: number;
  currency?: string;
  scopeSummary: string;
  includedItems: string[];
  excludedItems: string[];
  proposedStartDate: string;
  estimatedDurationDays: number;
  revisionsIncluded: number;
  note?: string;
  alternativeExplanation?: string;
}

export const quoteService = {
  /**
   * Determine budget relation against client's indicative budget
   */
  calculateBudgetRelation(
    amountMinor: number,
    indicativeBudget?: ProjectBudget
  ): BudgetRelation {
    if (!indicativeBudget || indicativeBudget.budgetType === 'unsure') {
      return 'within_budget';
    }

    const maxMinor = indicativeBudget.maxAmountMinor;
    if (maxMinor === undefined || maxMinor === null || maxMinor <= 0) {
      return 'within_budget';
    }

    if (amountMinor <= maxMinor) {
      return 'within_budget';
    } else if (amountMinor <= maxMinor * 1.25) {
      return 'slightly_above';
    } else {
      return 'materially_above';
    }
  },

  /**
   * Validate quote inputs
   */
  validateQuoteInput(
    input: SubmitQuoteInput,
    indicativeBudget?: ProjectBudget
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.amountMinor || input.amountMinor <= 0) {
      errors.push('Total commercial quote amount must be greater than zero.');
    }

    if (input.amountMinor < 50000) {
      errors.push('Alongby minimum project engagement is €500.');
    }

    if (!input.scopeSummary || input.scopeSummary.trim().length < 15) {
      errors.push('Please provide a scope delivery summary (at least 15 characters).');
    }

    if (!input.proposedStartDate) {
      errors.push('Please provide your proposed kickoff date.');
    }

    if (!input.estimatedDurationDays || input.estimatedDurationDays < 1) {
      errors.push('Estimated duration must be at least 1 day.');
    }

    if (input.revisionsIncluded === undefined || input.revisionsIncluded < 0) {
      errors.push('Revisions included must be 0 or greater.');
    }

    if (input.quoteType === 'alternative') {
      if (!input.alternativeExplanation || input.alternativeExplanation.trim().length < 20) {
        errors.push(
          'Please explain why an alternative scope or pricing proposal is recommended (at least 20 characters).'
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Submit Quote or Alternative Proposal
   */
  async submitQuote(
    input: SubmitQuoteInput,
    professionalId: string
  ): Promise<Quote> {
    // 1. Verify Opportunity
    const opp = await opportunityService.getOpportunity(input.opportunityId, professionalId);
    if (!opp) {
      throw new Error(`Opportunity ${input.opportunityId} not found or unauthorized.`);
    }

    if (opp.status === 'passed' || opp.status === 'interested' || opp.status === 'alternative_proposal') {
      throw new Error('You have already submitted a response for this opportunity.');
    }

    if (new Date(opp.expiresAt) < new Date()) {
      throw new Error('This opportunity has expired and no longer accepts proposals.');
    }

    // 2. Validate Input
    const validation = this.validateQuoteInput(input, opp.projectSnapshot.indicativeBudget);
    if (!validation.valid) {
      throw new Error(`Quote validation failed: ${validation.errors.join(' ')}`);
    }

    const budgetRelation = this.calculateBudgetRelation(
      input.amountMinor,
      opp.projectSnapshot.indicativeBudget
    );

    const nowIso = new Date().toISOString();
    const quoteRef = doc(collection(db, 'quotes'));

    // 3. Create Quote Document
    const quote: Quote = {
      id: quoteRef.id,
      projectId: opp.projectId,
      opportunityId: opp.id,
      matchId: opp.matchId,
      professionalId,
      quoteType: input.quoteType,
      amountMinor: input.amountMinor,
      currency: input.currency || opp.projectSnapshot.indicativeBudget?.currency || 'EUR',
      scopeSummary: input.scopeSummary.trim(),
      includedItems: input.includedItems.filter((i) => i && i.trim().length > 0),
      excludedItems: input.excludedItems.filter((i) => i && i.trim().length > 0),
      proposedStartDate: input.proposedStartDate,
      estimatedDurationDays: input.estimatedDurationDays,
      revisionsIncluded: input.revisionsIncluded,
      note: input.note?.trim() || '',
      alternativeExplanation: input.alternativeExplanation?.trim() || '',
      budgetRelation,
      status: 'submitted',
      version: 1,
      createdAt: nowIso,
      submittedAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(quoteRef, quote);
    } catch (e: any) {
      console.error('[quoteService] Error in setDoc(quoteRef):', e.message);
      throw e;
    }

    // 4. Update Opportunity status & link
    const oppRef = doc(db, 'opportunities', opp.id);
    const newOppStatus = input.quoteType === 'standard' ? 'interested' : 'alternative_proposal';
    try {
      await updateDoc(oppRef, {
        status: newOppStatus,
        quoteId: quote.id,
        responseType: input.quoteType === 'standard' ? 'standard_quote' : 'alternative_proposal',
        respondedAt: nowIso,
        updatedAt: nowIso,
      });
    } catch (e: any) {
      console.error('[quoteService] Error in updateDoc(oppRef):', e.message);
      throw e;
    }

    // 5. Update Match Candidate status
    if (opp.matchId) {
      try {
        await matchingService.updateMatchStatus(opp.projectId, opp.matchId, 'responded');
      } catch (e: any) {
        console.warn('[quoteService] Notice updating match candidate status:', e.message);
      }
    }

    // 6. Log Project Activity
    const quoteDesc =
      input.quoteType === 'standard'
        ? `Structured quote (€${(input.amountMinor / 100).toLocaleString()}) submitted by matched professional.`
        : `Alternative proposal (€${(input.amountMinor / 100).toLocaleString()}) submitted with tailored scope amendments.`;

    try {
      await projectService.logActivity(
        opp.projectId,
        professionalId,
        'professional',
        input.quoteType === 'standard' ? 'quote_submitted' : 'alternative_proposal_submitted',
        input.quoteType === 'standard' ? 'Quote submitted' : 'Alternative proposal submitted',
        quoteDesc,
        { quoteId: quote.id, quoteType: input.quoteType, amountMinor: input.amountMinor }
      );
    } catch (e: any) {
      console.error('[quoteService] Error in logActivity:', e.message);
      throw e;
    }

    // 7. Audit log
    try {
      await auditService.logEvent(
        professionalId,
        'professional',
        'QUOTE_SUBMITTED',
        'quote',
        quote.id,
        {
          projectId: opp.projectId,
          opportunityId: opp.id,
          quoteType: input.quoteType,
          amountMinor: input.amountMinor,
          budgetRelation,
        }
      );
    } catch (e: any) {
      console.error('[quoteService] Error in auditService.logEvent:', e.message);
      throw e;
    }

    return quote;
  },

  /**
   * Get single quote by ID
   */
  async getQuote(quoteId: string, authorizedProfId?: string): Promise<Quote | null> {
    const snap = await getDoc(doc(db, 'quotes', quoteId));
    if (!snap.exists()) return null;
    const quote = snap.data() as Quote;

    if (authorizedProfId && quote.professionalId !== authorizedProfId) {
      throw new Error('Unauthorized to view this quote.');
    }

    return quote;
  },

  /**
   * Get quote linked to an opportunity
   */
  async getQuoteForOpportunity(
    opportunityId: string,
    professionalId?: string
  ): Promise<Quote | null> {
    try {
      const constraints: any[] = [where('opportunityId', '==', opportunityId)];
      if (professionalId) {
        constraints.push(where('professionalId', '==', professionalId));
      }
      const q = query(collection(db, 'quotes'), ...constraints);
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as Quote;
    } catch (err: any) {
      console.warn('[quoteService] getQuoteForOpportunity query notice:', err.message);
      return null;
    }
  },

  /**
   * Admin: Get all quotes for a project
   */
  async getQuotesForProject(projectId: string): Promise<Quote[]> {
    const q = query(collection(db, 'quotes'), where('projectId', '==', projectId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Quote);
  },
};
