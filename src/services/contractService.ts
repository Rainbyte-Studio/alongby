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
  Contract,
  ContractPartySnapshot,
  Proposal,
} from '../types';
import { projectService } from './projectService';
import { proposalService } from './proposalService';
import { profileService } from './profileService';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import {
  CONTRACT_TEMPLATE_METADATA,
  generateContractLegalSections,
} from './contractTemplateService';
import { removeUndefinedFields } from './firestoreUtils';
import { defaultSignatureAdapter } from './esignature/AlongbyDevelopmentSignatureAdapter';

/**
 * Fast deterministic SHA-256 style fingerprint generator for browser environments
 */
async function computeDocumentFingerprint(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(content);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Deterministic fallback hash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export const contractService = {
  /**
   * Retrieve a contract by unique ID
   */
  async getContract(contractId: string): Promise<Contract | null> {
    const snap = await getDoc(doc(db, 'contracts', contractId));
    if (!snap.exists()) return null;
    return snap.data() as Contract;
  },

  /**
   * Retrieve active or most recent contract for a project
   */
  async getContractByProject(projectId: string): Promise<Contract | null> {
    const project = await projectService.getProject(projectId);
    if (!project) return null;

    if (project.currentContractId) {
      const current = await this.getContract(project.currentContractId);
      if (current) return current;
    }

    const q = query(collection(db, 'contracts'), where('projectId', '==', projectId));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const contracts = snap.docs.map((d) => d.data() as Contract);
    contracts.sort((a, b) => b.contractVersion - a.contractVersion);
    return contracts[0];
  },

  /**
   * Generate formal contract from mutually accepted proposal
   */
  async generateContractFromAcceptedProposal(
    proposalId: string,
    actorId: string
  ): Promise<Contract> {
    const proposal = await proposalService.getProposal(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found.`);

    if (proposal.status !== 'accepted') {
      throw new Error(
        `Cannot generate contract: Proposal is in '${proposal.status}' state (must be 'accepted').`
      );
    }

    // Check if contract already exists
    const existingContract = await this.getContractByProject(proposal.projectId);
    if (existingContract && existingContract.proposalId === proposalId) {
      return existingContract;
    }

    const project = await projectService.getProject(proposal.projectId);
    if (!project) throw new Error(`Project ${proposal.projectId} not found.`);

    const nowIso = new Date().toISOString();
    const contractId = `cont_${proposal.projectId}_v1`;

    // Deterministic human-friendly contract number
    const projectSeq = proposal.projectId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    const contractNumber = `ALB-2026-${projectSeq}`;

    // Fetch participant profiles for legal snapshots
    let clientSnapshot: ContractPartySnapshot = {
      userId: proposal.clientId,
      fullName: proposal.clientAcceptance?.acceptedByName || project.clientName || 'Authorized Client',
      companyName: project.clientCompanyName || undefined,
      email: 'client@alongby-verified.internal',
      country: 'European Union / International',
      role: 'client',
    };

    let profSnapshot: ContractPartySnapshot = {
      userId: proposal.professionalId,
      fullName:
        proposal.professionalAcceptance?.acceptedByName || 'Verified Specialist Partner',
      companyName: undefined,
      email: 'specialist@alongby-verified.internal',
      country: 'European Union / International',
      role: 'professional',
    };

    try {
      // High-security privacy boundary: only the client themselves (or admin) can read their private profile document.
      // Specialists receive only project-authorized client details from the Project/Proposal documents.
      if (actorId === proposal.clientId) {
        const cp = await profileService.getClientProfile(proposal.clientId);
        if (cp) {
          clientSnapshot = {
            userId: proposal.clientId,
            fullName: cp.fullName || clientSnapshot.fullName,
            companyName: cp.companyName || clientSnapshot.companyName,
            email: `${proposal.clientId}@client.alongby.com`,
            country: cp.country || clientSnapshot.country,
            role: 'client',
          };
        }
      }

      const pp = await profileService.getProfessionalProfile(proposal.professionalId);
      if (pp) {
        profSnapshot = {
          userId: proposal.professionalId,
          fullName: pp.displayName || profSnapshot.fullName,
          companyName: pp.professionalTitle || undefined,
          email: `${proposal.professionalId}@pro.alongby.com`,
          country: pp.country || profSnapshot.country,
          role: 'professional',
        };
      }
    } catch (e) {
      console.warn('Non-blocking profile snapshot retrieval error:', e);
    }

    // Compile legal sections
    const legalSections = generateContractLegalSections(
      proposal,
      clientSnapshot,
      profSnapshot,
      contractNumber
    );

    // Compute cryptographic document fingerprint
    const canonicalText = `${contractNumber}|${proposal.id}|v${proposal.version}|${proposal.commercialTerms.totalAmountMinor}|${proposal.commercialTerms.currency}|${legalSections.map((s) => s.content).join('::')}`;
    const documentFingerprint = await computeDocumentFingerprint(canonicalText);

    // Initialize E-Signature Envelope via Provider Adapter
    const envelopeResult = await defaultSignatureAdapter.createEnvelope({
      contractId,
      contractNumber,
      documentTitle: `Alongby Master Services Contract — ${contractNumber}`,
      documentFingerprint,
      signers: [
        {
          userId: clientSnapshot.userId,
          role: 'client',
          name: clientSnapshot.fullName,
          email: clientSnapshot.email,
        },
        {
          userId: profSnapshot.userId,
          role: 'professional',
          name: profSnapshot.fullName,
          email: profSnapshot.email,
        },
      ],
    });

    const contract: Contract = {
      id: contractId,
      contractNumber,
      projectId: proposal.projectId,
      proposalId: proposal.id,
      proposalVersion: proposal.version,
      clientId: proposal.clientId,
      professionalId: proposal.professionalId,
      contractVersion: 1,
      status: 'awaiting_signatures',
      templateVersion: CONTRACT_TEMPLATE_METADATA.templateVersion,
      termsVersion: CONTRACT_TEMPLATE_METADATA.termsVersion,
      proposalSnapshot: proposal,
      clientSnapshot,
      professionalSnapshot: profSnapshot,
      projectTitle: project.title || 'Alongby Curated Project',
      legalSections,
      eSignature: {
        provider: envelopeResult.provider,
        envelopeId: envelopeResult.envelopeId,
        status: envelopeResult.status,
        mode: envelopeResult.mode,
        providerNotice: envelopeResult.providerNotice,
        signers: envelopeResult.signers,
        createdAt: envelopeResult.createdAt,
        auditLog: [envelopeResult.auditEntry],
      },
      documentFingerprint,
      generatedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save contract
    await setDoc(doc(db, 'contracts', contract.id), removeUndefinedFields(contract));

    // Update project state: project is now 'awaiting_signatures'
    await updateDoc(doc(db, 'projects', proposal.projectId), removeUndefinedFields({
      currentContractId: contract.id,
      status: 'awaiting_signatures',
      updatedAt: nowIso,
    }));

    // Project Activity
    await projectService.logActivity(
      proposal.projectId,
      actorId,
      'admin',
      'contract_generated',
      `Master Services Agreement ${contractNumber} compiled`,
      `Electronic signature envelope dispatched to Client (${clientSnapshot.fullName}) and Specialist (${profSnapshot.fullName}). Parallel execution ready.`,
      { contractId: contract.id, contractNumber, envelopeId: envelopeResult.envelopeId }
    );

    // Notifications
    await notificationService.dispatchNotification(
      proposal.clientId,
      'contract_ready_for_signature',
      'Contract Ready for Electronic Signature',
      `Master Services Contract ${contractNumber} has been generated. Please review and sign the agreement.`,
      `/client/projects/${proposal.projectId}/contract`,
      { projectId: proposal.projectId, contractId: contract.id }
    );

    await notificationService.dispatchNotification(
      proposal.professionalId,
      'contract_ready_for_signature',
      'Contract Ready for Electronic Signature',
      `Master Services Contract ${contractNumber} has been generated. Please review and sign the agreement.`,
      `/professional/projects/${proposal.projectId}/contract`,
      { projectId: proposal.projectId, contractId: contract.id }
    );

    await auditService.logEvent(
      actorId,
      'admin',
      'CONTRACT_GENERATED',
      'contract',
      contract.id,
      { projectId: proposal.projectId, contractNumber }
    );

    return contract;
  },

  /**
   * Execute Electronic Signature by Client or Professional
   */
  async executeSignature(
    contractId: string,
    partyRole: 'client' | 'professional',
    actorId: string,
    signatureDetails: {
      typedSignature: string;
      acceptedTerms: boolean;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Contract> {
    const contract = await this.getContract(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found.`);

    if (contract.status === 'fully_signed') {
      return contract;
    }

    if (contract.status === 'cancelled' || contract.status === 'superseded') {
      throw new Error(`Cannot sign contract in '${contract.status}' state.`);
    }

    if (!signatureDetails.acceptedTerms) {
      throw new Error('You must formally accept the contractual terms to execute your signature.');
    }

    // Role authorization
    if (partyRole === 'client' && contract.clientId !== actorId) {
      throw new Error('Unauthorized: You are not the client for this contract.');
    }
    if (partyRole === 'professional' && contract.professionalId !== actorId) {
      throw new Error('Unauthorized: You are not the assigned specialist for this contract.');
    }

    // Identify signer in envelope
    const signer = contract.eSignature.signers.find((s) => s.userId === actorId);
    if (!signer) {
      throw new Error('Signer record not found on this contract envelope.');
    }

    if (signer.status === 'signed') {
      return contract; // Already signed
    }

    const actorName = signatureDetails.typedSignature.trim() || signer.name;

    // Process signature via provider adapter
    const updateResult = await defaultSignatureAdapter.submitSignature(
      contract.eSignature.signers,
      {
        signerId: signer.signerId,
        typedSignature: signatureDetails.typedSignature,
        ipAddress: signatureDetails.ipAddress,
        userAgent: signatureDetails.userAgent,
      },
      actorName,
      partyRole
    );

    const nowIso = new Date().toISOString();
    const isFullySigned = updateResult.status === 'completed';

    const updatedContractStatus = isFullySigned ? 'fully_signed' : 'partially_signed';

    const updatedContract: Contract = {
      ...contract,
      status: updatedContractStatus,
      eSignature: {
        ...contract.eSignature,
        status: updateResult.status,
        signers: updateResult.updatedSigners,
        completedAt: updateResult.completedAt,
        auditLog: [...contract.eSignature.auditLog, updateResult.auditEntry],
      },
      fullySignedAt: isFullySigned ? nowIso : undefined,
      updatedAt: nowIso,
    };

    await updateDoc(doc(db, 'contracts', contractId), removeUndefinedFields({
      status: updatedContractStatus,
      eSignature: updatedContract.eSignature,
      fullySignedAt: updatedContract.fullySignedAt || null,
      updatedAt: nowIso,
    }));

    if (isFullySigned) {
      /**
       * CRITICAL REQUIREMENT #38:
       * A fully signed contract does NOT activate the project!
       * State transitions strictly to 'awaiting_deposit'.
       * Future Phase 6 will handle deposit funding.
       */
      await updateDoc(doc(db, 'projects', contract.projectId), removeUndefinedFields({
        status: 'awaiting_deposit',
        updatedAt: nowIso,
      }));

      await projectService.logActivity(
        contract.projectId,
        actorId,
        partyRole,
        'contract_fully_signed',
        `Contract ${contract.contractNumber} fully executed`,
        `All parties have electronically signed Master Services Agreement ${contract.contractNumber}. Project state transitioned to 'awaiting_deposit' pending Phase 6 staged milestone payment funding.`,
        { contractId, contractNumber: contract.contractNumber }
      );

      // Notify Client
      await notificationService.dispatchNotification(
        contract.clientId,
        'contract_fully_signed',
        'Agreement Fully Executed',
        `Master Services Contract ${contract.contractNumber} has been signed by both parties. Next step: Fund Phase 1 payment protection deposit to initiate kickoff.`,
        `/client/projects/${contract.projectId}/contract`,
        { projectId: contract.projectId, contractId }
      );

      // Notify Professional
      await notificationService.dispatchNotification(
        contract.professionalId,
        'contract_fully_signed',
        'Agreement Fully Executed',
        `Master Services Contract ${contract.contractNumber} is fully executed. Awaiting client Phase 1 milestone staged deposit before kickoff.`,
        `/professional/projects/${contract.projectId}/contract`,
        { projectId: contract.projectId, contractId }
      );

      await auditService.logEvent(
        actorId,
        partyRole,
        'CONTRACT_FULLY_EXECUTED',
        'contract',
        contractId,
        { projectId: contract.projectId, contractNumber: contract.contractNumber }
      );
    } else {
      // Partial signature
      await projectService.logActivity(
        contract.projectId,
        actorId,
        partyRole,
        'contract_partially_signed',
        `Contract electronically signed by ${partyRole}`,
        `${actorName} (${partyRole.toUpperCase()}) has executed Agreement ${contract.contractNumber}. Awaiting counterparty signature.`,
        { contractId, partyRole }
      );

      const counterpartId =
        partyRole === 'client' ? contract.professionalId : contract.clientId;
      const counterpartLink =
        partyRole === 'client'
          ? `/professional/projects/${contract.projectId}/contract`
          : `/client/projects/${contract.projectId}/contract`;

      await notificationService.dispatchNotification(
        counterpartId,
        'contract_partially_signed',
        `${actorName} has signed the Contract`,
        `${actorName} has signed Master Services Contract ${contract.contractNumber}. Please countersign to complete the execution.`,
        counterpartLink,
        { projectId: contract.projectId, contractId }
      );
    }

    return updatedContract;
  },
};
