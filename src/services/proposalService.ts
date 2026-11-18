import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Proposal,
  ProposalStatus,
  ProposalDeliverable,
  ProposalMilestone,
  ProposalChangeRequest,
  ProfessionalSelection,
  PartyAcceptance,
  UserRole,
} from '../types';
import { projectService } from './projectService';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { profileService } from './profileService';
import { removeUndefinedFields } from './firestoreUtils';

export const proposalService = {
  /**
   * Retrieve a proposal by its unique ID
   */
  async getProposal(proposalId: string): Promise<Proposal | null> {
    const snap = await getDoc(doc(db, 'proposals', proposalId));
    if (!snap.exists()) return null;
    return snap.data() as Proposal;
  },

  /**
   * Retrieve the active or most recent proposal for a project
   */
  async getProposalByProject(projectId: string): Promise<Proposal | null> {
    const project = await projectService.getProject(projectId);
    if (!project) return null;

    if (project.currentProposalId) {
      const current = await this.getProposal(project.currentProposalId);
      if (current) return current;
    }

    // Fallback query by projectId
    const q = query(collection(db, 'proposals'), where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const proposals = querySnapshot.docs.map((d) => d.data() as Proposal);
    // Sort descending by version
    proposals.sort((a, b) => b.version - a.version);
    return proposals[0];
  },

  /**
   * Initialize Proposal v1 automatically or on-demand from the selection snapshot & brief
   * Supports configurable Phase 1 / Phase 2 splits (defaults to 50/50, but configurable and validated).
   */
  async initializeProposalFromSelection(
    projectId: string,
    actorId: string,
    customSplit?: { phase1Percentage?: number; phase1AmountMinor?: number }
  ): Promise<Proposal> {
    const project = await projectService.getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found.`);

    if (
      project.status !== 'professional_selected' &&
      project.status !== 'proposal_pending' &&
      project.status !== 'shortlist_ready'
    ) {
      // Check if proposal already exists
      const existing = await this.getProposalByProject(projectId);
      if (existing) return existing;
      throw new Error(`Cannot initialize proposal in project state '${project.status}'.`);
    }

    // Fetch selection snapshot
    const selectionSnap = await getDoc(doc(db, 'projects', projectId, 'selection', 'current'));
    if (!selectionSnap.exists()) {
      throw new Error('No selection snapshot found for this project.');
    }
    const selection = selectionSnap.data() as ProfessionalSelection;

    const totalMinor = selection.selectionSnapshot.amountMinor;

    // Configurable payment split with strict mathematical validation
    let phase1Percentage = 50;
    let phase1Minor = Math.round(totalMinor * 0.5);

    if (customSplit) {
      if (customSplit.phase1AmountMinor !== undefined) {
        phase1Minor = Math.round(customSplit.phase1AmountMinor);
        phase1Percentage = Math.round((phase1Minor / totalMinor) * 100);
      } else if (customSplit.phase1Percentage !== undefined) {
        phase1Percentage = Math.min(90, Math.max(10, Math.round(customSplit.phase1Percentage)));
        phase1Minor = Math.round((totalMinor * phase1Percentage) / 100);
      }
    }

    const phase2Minor = totalMinor - phase1Minor;
    const phase2Percentage = 100 - phase1Percentage;

    // Strict validation: Phase 1 + Phase 2 MUST equal Total Amount
    if (phase1Minor + phase2Minor !== totalMinor) {
      throw new Error(
        `Commercial payment split invalid: Phase 1 (${phase1Minor}) + Phase 2 (${phase2Minor}) must equal Total (${totalMinor}).`
      );
    }
    if (phase1Minor <= 0 || phase2Minor <= 0) {
      throw new Error('Both Phase 1 and Phase 2 payment amounts must be greater than zero.');
    }

    const nowIso = new Date().toISOString();
    const proposalId = `prop_${projectId}_v1`;

    // Build structured deliverables
    const includedItems = selection.selectionSnapshot.includedItems || [];
    const midPoint = Math.ceil(includedItems.length / 2);
    const phase1Items = includedItems.slice(0, midPoint);
    const phase2Items = includedItems.slice(midPoint);

    const deliverables: ProposalDeliverable[] = [
      {
        id: 'del_p1_discovery',
        title: 'Phase 1: Architecture, Wireframes & Kickoff Alignment',
        description:
          phase1Items.length > 0
            ? phase1Items.join('; ')
            : 'Requirements decomposition, technical architecture blueprint, design tokens and initial milestone delivery.',
        phase: 1,
        estimatedDueDays: Math.max(7, Math.round(selection.selectionSnapshot.estimatedDurationDays * 0.4)),
        acceptanceCriteria: [
          'All project foundational requirements and visual direction formally approved',
          'Wireframes and preliminary architecture validated by client',
          'Milestone handoff package provided with documentation',
        ],
      },
      {
        id: 'del_p2_execution',
        title: 'Phase 2: Full Build, Testing & Launch Deployment',
        description:
          phase2Items.length > 0
            ? phase2Items.join('; ')
            : 'Core implementation, responsive QA across desktop and mobile, deployment handoff and code delivery.',
        phase: 2,
        estimatedDueDays: selection.selectionSnapshot.estimatedDurationDays,
        acceptanceCriteria: [
          'Full deliverable scope satisfying brief specifications',
          'Responsive cross-device functional QA verified with zero critical defects',
          'Production build handoff and asset repository transfer completed',
        ],
      },
    ];

    const milestones: ProposalMilestone[] = [
      {
        id: 'ms_phase_1',
        title: 'Milestone 1: Project Kickoff & Phase 1 Deliverables',
        description: `Initial ${phase1Percentage}% milestone payment secured under staged payment protection before kickoff; released upon Phase 1 signoff.`,
        phase: 1,
        order: 1,
        amountMinor: phase1Minor,
        percentage: phase1Percentage,
        acceptanceCriteria: deliverables[0].acceptanceCriteria,
        revisionsAllowed: 1,
      },
      {
        id: 'ms_phase_2',
        title: 'Milestone 2: Final Delivery, QA & Platform Launch',
        description: `Remaining ${phase2Percentage}% milestone balance payable upon final deliverable inspection and signoff.`,
        phase: 2,
        order: 2,
        amountMinor: phase2Minor,
        percentage: phase2Percentage,
        acceptanceCriteria: deliverables[1].acceptanceCriteria,
        revisionsAllowed: selection.selectionSnapshot.revisionsIncluded || 2,
      },
    ];

    const estimatedDurationDays = selection.selectionSnapshot.estimatedDurationDays || 30;
    const startDate =
      selection.selectionSnapshot.proposedStartDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const completionDateObj = new Date(new Date(startDate).getTime() + estimatedDurationDays * 24 * 60 * 60 * 1000);

    const proposal: Proposal = {
      id: proposalId,
      projectId,
      clientId: project.clientId,
      professionalId: selection.professionalId,
      selectedQuoteId: selection.quoteId,
      selectedShortlistId: selection.shortlistId,
      sourceBriefSnapshotId: `snap_${projectId}`,
      version: 1,
      status: 'pending_review',
      title: `${project.title || 'Project'} — Final Commercial Proposal`,
      scopeSummary:
        selection.selectionSnapshot.scopeSummary ||
        'Comprehensive execution of all agreed project specifications as formulated in curated commercial quote.',
      deliverables,
      exclusions:
        selection.selectionSnapshot.excludedItems && selection.selectionSnapshot.excludedItems.length > 0
          ? selection.selectionSnapshot.excludedItems
          : [
              'Third-party cloud infrastructure hosting or API subscription expenses',
              'Copywriting or multi-language translation services outside the brief',
              'Out-of-scope feature requests not specified in this proposal',
            ],
      assumptions: [
        'Client provides brand assets, credentials, and feedback within 3 business days of milestone submission',
        'Direct async communication maintained throughout engagement via Alongby messaging',
        'Scope adjustments beyond agreed deliverables require formal written change order',
      ],
      clientResponsibilities: [
        'Prompt review and testing of deliverables during the 5-business-day inspection window',
        'Provision of necessary third-party access tokens and source materials',
        'Staged payment deposit funding prior to kickoff',
      ],
      commercialTerms: {
        totalAmountMinor: totalMinor,
        currency: selection.selectionSnapshot.currency || 'EUR',
        phase1AmountMinor: phase1Minor,
        phase1Percentage,
        phase2AmountMinor: phase2Minor,
        phase2Percentage,
        revisionsIncluded: selection.selectionSnapshot.revisionsIncluded || 2,
        revisionPolicy:
          'Includes specified rounds of revisions. Revisions must be consolidated and actionable within the 5-day review window.',
        proposedStartDate: startDate,
        estimatedDurationDays,
        estimatedCompletionDate: completionDateObj.toISOString().split('T')[0],
      },
      milestones,
      specialTerms: [
        `Staged payment structure: ${phase1Percentage}% upfront payment protection hold; ${phase2Percentage}% upon final delivery and acceptance`,
        'Full intellectual property ownership transfers to client immediately upon receipt of final settlement',
      ],
      createdBy: actorId,
      createdAt: nowIso,
      updatedAt: nowIso,
      sentForReviewAt: nowIso,
      changeRequests: [],
    };

    // Save to proposals collection
    await setDoc(doc(db, 'proposals', proposal.id), removeUndefinedFields(proposal));

    // Update project state to 'proposal_pending'
    await updateDoc(doc(db, 'projects', projectId), removeUndefinedFields({
      status: 'proposal_pending',
      currentProposalId: proposal.id,
      updatedAt: nowIso,
    }));

    // Project activity event
    await projectService.logActivity(
      projectId,
      actorId,
      'professional',
      'proposal_created',
      'Final commercial proposal formulated',
      `Proposal v1 compiled with total value of ${(totalMinor / 100).toLocaleString()} ${proposal.commercialTerms.currency}. Two-stage staged payment terms ready for review.`,
      { proposalId: proposal.id, version: 1, totalMinor }
    );

    // Notifications to client & professional
    await notificationService.dispatchNotification(
      project.clientId,
      'proposal_pending',
      'Final Proposal Ready for Review',
      `The final commercial proposal for "${project.title}" has been prepared. Please review scope, milestones, and commercial terms.`,
      `/client/projects/${projectId}/proposal`,
      { projectId, proposalId: proposal.id }
    );

    await notificationService.dispatchNotification(
      selection.professionalId,
      'proposal_pending',
      'Final Proposal Ready for Review',
      `The final commercial proposal for "${project.title}" is ready. Review commercial terms and confirm agreement.`,
      `/professional/projects/${projectId}/proposal`,
      { projectId, proposalId: proposal.id }
    );

    return proposal;
  },

  /**
   * Submit a structured Change Request from either Client or Professional
   */
  async submitChangeRequest(
    proposalId: string,
    params: {
      projectId: string;
      requestedBy: string;
      requestedByRole: UserRole;
      requestedByName: string;
      category: ProposalChangeRequest['category'];
      message: string;
      suggestedChanges?: ProposalChangeRequest['suggestedChanges'];
    }
  ): Promise<ProposalChangeRequest> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found.`);

    if (proposal.status === 'accepted') {
      throw new Error('Cannot request changes on an already accepted proposal.');
    }

    const nowIso = new Date().toISOString();
    const changeRequestId = `cr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const changeRequest: ProposalChangeRequest = {
      id: changeRequestId,
      proposalId,
      proposalVersion: proposal.version,
      projectId: params.projectId,
      requestedBy: params.requestedBy,
      requestedByRole: params.requestedByRole,
      requestedByName: params.requestedByName,
      category: params.category,
      message: params.message,
      suggestedChanges: params.suggestedChanges || [],
      status: 'open',
      createdAt: nowIso,
    };

    const updatedChangeRequests = [...(proposal.changeRequests || []), changeRequest];

    // Update proposal status to 'changes_requested' and reset any partial acceptance
    await updateDoc(doc(db, 'proposals', proposalId), {
      status: 'changes_requested',
      changeRequests: updatedChangeRequests,
      clientAcceptance: null,
      professionalAcceptance: null,
      updatedAt: nowIso,
    });

    // Project activity
    await projectService.logActivity(
      params.projectId,
      params.requestedBy,
      params.requestedByRole,
      'proposal_change_requested',
      `Proposal change requested by ${params.requestedByName}`,
      `Topic: ${params.category.toUpperCase()} — ${params.message.slice(0, 120)}...`,
      { proposalId, changeRequestId, category: params.category }
    );

    // Notify other party
    const counterpartyId =
      params.requestedByRole === 'client' ? proposal.professionalId : proposal.clientId;
    const counterpartyLink =
      params.requestedByRole === 'client'
        ? `/professional/projects/${params.projectId}/proposal`
        : `/client/projects/${params.projectId}/proposal`;

    await notificationService.dispatchNotification(
      counterpartyId,
      'proposal_change_requested',
      'Proposal Revision Requested',
      `${params.requestedByName} requested adjustments to the proposal (${params.category}).`,
      counterpartyLink,
      { projectId: params.projectId, proposalId }
    );

    return changeRequest;
  },

  /**
   * Create an updated version of the proposal (e.g. v2, v3) after revisions
   */
  async createRevisedVersion(
    currentProposalId: string,
    modifications: Partial<Proposal>,
    actorId: string
  ): Promise<Proposal> {
    const current = await this.getProposal(currentProposalId);
    if (!current) throw new Error(`Proposal ${currentProposalId} not found.`);

    const nowIso = new Date().toISOString();
    const nextVersion = current.version + 1;
    const newProposalId = `prop_${current.projectId}_v${nextVersion}`;

    // Mark current proposal as superseded
    await updateDoc(doc(db, 'proposals', currentProposalId), {
      status: 'superseded',
      supersededByProposalId: newProposalId,
      updatedAt: nowIso,
    });

    const newProposal: Proposal = {
      ...current,
      ...modifications,
      id: newProposalId,
      version: nextVersion,
      status: 'pending_review',
      createdAt: nowIso,
      updatedAt: nowIso,
      sentForReviewAt: nowIso,
      clientAcceptance: undefined,
      professionalAcceptance: undefined,
      supersededByProposalId: undefined,
    };

    // Recalculate and validate commercial splits if commercial terms changed
    if (newProposal.commercialTerms) {
      const total = newProposal.commercialTerms.totalAmountMinor;
      const p1 = newProposal.commercialTerms.phase1AmountMinor || Math.round(total * 0.5);
      const p2 = total - p1;
      
      if (p1 + p2 !== total) {
        throw new Error(
          `Invalid commercial split: Phase 1 (${p1}) + Phase 2 (${p2}) must equal Total (${total}).`
        );
      }
      if (p1 <= 0 || p2 <= 0) {
        throw new Error('Both Phase 1 and Phase 2 split amounts must be greater than zero.');
      }

      newProposal.commercialTerms.phase1AmountMinor = p1;
      newProposal.commercialTerms.phase2AmountMinor = p2;
      newProposal.commercialTerms.phase1Percentage = Math.round((p1 / total) * 100);
      newProposal.commercialTerms.phase2Percentage = 100 - newProposal.commercialTerms.phase1Percentage;

      // Synchronize milestones with revised commercial terms
      if (newProposal.milestones && newProposal.milestones.length >= 2) {
        newProposal.milestones[0].amountMinor = p1;
        newProposal.milestones[0].percentage = newProposal.commercialTerms.phase1Percentage;
        newProposal.milestones[0].description = `Initial ${newProposal.commercialTerms.phase1Percentage}% milestone payment secured under staged payment protection before kickoff; released upon Phase 1 signoff.`;
        newProposal.milestones[1].amountMinor = p2;
        newProposal.milestones[1].percentage = newProposal.commercialTerms.phase2Percentage;
        newProposal.milestones[1].description = `Remaining ${newProposal.commercialTerms.phase2Percentage}% milestone balance payable upon final deliverable inspection and signoff.`;
      }
    }

    await setDoc(doc(db, 'proposals', newProposal.id), removeUndefinedFields(newProposal));

    // Update project reference
    await updateDoc(doc(db, 'projects', current.projectId), removeUndefinedFields({
      currentProposalId: newProposal.id,
      status: 'proposal_pending',
      updatedAt: nowIso,
    }));

    // Log activity
    await projectService.logActivity(
      current.projectId,
      actorId,
      'admin',
      'proposal_revised',
      `Proposal updated to v${nextVersion}`,
      `Revised proposal terms published for client and specialist signoff.`,
      { proposalId: newProposal.id, version: nextVersion }
    );

    // Notify both parties
    await notificationService.dispatchNotification(
      newProposal.clientId,
      'proposal_pending',
      `Updated Proposal (v${nextVersion}) Ready`,
      `A revised version of the commercial proposal has been published for your review.`,
      `/client/projects/${newProposal.projectId}/proposal`,
      { projectId: newProposal.projectId, proposalId: newProposal.id }
    );

    await notificationService.dispatchNotification(
      newProposal.professionalId,
      'proposal_pending',
      `Updated Proposal (v${nextVersion}) Ready`,
      `A revised version of the commercial proposal has been published for your review.`,
      `/professional/projects/${newProposal.projectId}/proposal`,
      { projectId: newProposal.projectId, proposalId: newProposal.id }
    );

    return newProposal;
  },

  /**
   * Accept proposal by Client or Professional.
   * When both parties accept, status transitions to 'accepted', project to 'proposal_accepted'.
   */
  async acceptProposal(
    proposalId: string,
    partyRole: 'client' | 'professional',
    actorId: string,
    metadata?: { ipAddress?: string; typedName?: string }
  ): Promise<Proposal & { proposal: Proposal; bothAccepted: boolean }> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found.`);

    if (proposal.status === 'accepted') {
      return Object.assign({ ...proposal }, { proposal, bothAccepted: true });
    }

    if (proposal.status === 'superseded' || proposal.status === 'cancelled') {
      throw new Error(`Cannot accept proposal in '${proposal.status}' state.`);
    }

    // Role check
    if (partyRole === 'client' && proposal.clientId !== actorId) {
      throw new Error('Unauthorized: You are not the client for this proposal.');
    }
    if (partyRole === 'professional' && proposal.professionalId !== actorId) {
      throw new Error('Unauthorized: You are not the assigned specialist for this proposal.');
    }

    // Idempotency: If this party has already recorded acceptance, return current state without re-updating
    const currentPartyAccepted =
      partyRole === 'client'
        ? proposal.clientAcceptance?.accepted
        : proposal.professionalAcceptance?.accepted;

    if (currentPartyAccepted) {
      const alreadyBothAccepted = Boolean(
        proposal.clientAcceptance?.accepted && proposal.professionalAcceptance?.accepted
      );
      return Object.assign({ ...proposal }, { proposal, bothAccepted: alreadyBothAccepted });
    }

    const nowIso = new Date().toISOString();

    // Fetch actor name for audit
    let actorName = metadata?.typedName || (partyRole === 'client' ? 'Client' : 'Specialist');
    try {
      if (partyRole === 'client') {
        const cp = await profileService.getClientProfile(actorId);
        if (cp?.fullName) actorName = cp.fullName;
      } else {
        const pp = await profileService.getProfessionalProfile(actorId);
        if (pp?.displayName) actorName = pp.displayName;
      }
    } catch {
      // Non-blocking fallback
    }

    const acceptance: PartyAcceptance = {
      accepted: true,
      acceptedBy: actorId,
      acceptedByName: actorName,
      acceptedAt: nowIso,
      ipAddress: metadata?.ipAddress ? `Client-Reported: ${metadata.ipAddress}` : '[Dev Simulation — No Server IP]',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client',
      typedName: metadata?.typedName || actorName,
    };

    const isClient = partyRole === 'client';
    const updatedClientAcceptance = isClient ? acceptance : proposal.clientAcceptance;
    const updatedProfAcceptance = !isClient ? acceptance : proposal.professionalAcceptance;

    const bothAccepted = Boolean(
      updatedClientAcceptance?.accepted && updatedProfAcceptance?.accepted
    );

    const updatePayload: Record<string, any> = {
      updatedAt: nowIso,
    };
    if (updatedClientAcceptance) {
      updatePayload.clientAcceptance = updatedClientAcceptance;
    }
    if (updatedProfAcceptance) {
      updatePayload.professionalAcceptance = updatedProfAcceptance;
    }

    if (bothAccepted) {
      updatePayload.status = 'accepted';
      updatePayload.acceptedAt = nowIso;
    }

    await updateDoc(doc(db, 'proposals', proposalId), removeUndefinedFields(updatePayload));

    // Update project state if both accepted
    if (bothAccepted) {
      await updateDoc(doc(db, 'projects', proposal.projectId), {
        status: 'proposal_accepted',
        updatedAt: nowIso,
      });

      await projectService.logActivity(
        proposal.projectId,
        actorId,
        partyRole,
        'proposal_accepted',
        'Proposal mutually agreed by both parties',
        `Both Client (${updatedClientAcceptance?.acceptedByName}) and Specialist (${updatedProfAcceptance?.acceptedByName}) have formally accepted Proposal v${proposal.version}. Generating commercial contract.`,
        { proposalId, version: proposal.version }
      );

      // Notify both parties
      await notificationService.dispatchNotification(
        proposal.clientId,
        'proposal_accepted',
        'Commercial Proposal Mutually Accepted',
        `Both parties have accepted Proposal v${proposal.version}. Your formal agreement is being prepared for electronic signature.`,
        `/client/projects/${proposal.projectId}/contract`,
        { projectId: proposal.projectId, proposalId }
      );

      await notificationService.dispatchNotification(
        proposal.professionalId,
        'proposal_accepted',
        'Commercial Proposal Mutually Accepted',
        `Both parties have accepted Proposal v${proposal.version}. Your formal agreement is being prepared for electronic signature.`,
        `/professional/projects/${proposal.projectId}/contract`,
        { projectId: proposal.projectId, proposalId }
      );

      await auditService.logEvent(
        actorId,
        partyRole,
        'PROPOSAL_ACCEPTED_MUTUALLY',
        'proposal',
        proposalId,
        { projectId: proposal.projectId, version: proposal.version }
      );
    } else {
      // Single party accepted
      await projectService.logActivity(
        proposal.projectId,
        actorId,
        partyRole,
        'proposal_party_accepted',
        `Proposal accepted by ${partyRole}`,
        `${actorName} has accepted Proposal v${proposal.version}. Awaiting counterpart acceptance.`,
        { proposalId, partyRole }
      );

      const counterpartId = isClient ? proposal.professionalId : proposal.clientId;
      const counterpartLink = isClient
        ? `/professional/projects/${proposal.projectId}/proposal`
        : `/client/projects/${proposal.projectId}/proposal`;

      await notificationService.dispatchNotification(
        counterpartId,
        'proposal_pending',
        `${actorName} accepted the Proposal`,
        `${actorName} (${partyRole}) has formally agreed to Proposal v${proposal.version}. Please review and confirm your acceptance.`,
        counterpartLink,
        { projectId: proposal.projectId, proposalId }
      );
    }

    const updatedProposal = (await this.getProposal(proposalId)) as Proposal;
    return Object.assign({ ...updatedProposal }, { proposal: updatedProposal, bothAccepted });
  },
};
