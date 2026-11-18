import {
  ESignatureProvider,
  CreateEnvelopeParams,
  EnvelopeResult,
  SignActionParams,
  EnvelopeUpdateResult,
} from './ESignatureProvider';
import { ContractSigner, ContractAuditEntry } from '../../types';

/**
 * Alongby Development E-Signature Simulation Adapter
 *
 * CRITICAL COMPLIANCE NOTICE:
 * This is an internal developer test simulation only. It is NOT a production-grade
 * or legally binding electronic signature service. In production environments,
 * this adapter must be substituted with a certified external e-signature provider
 * (such as DocuSign, HelloSign, or Adobe Sign) using the ESignatureProvider interface.
 */
export class AlongbyDevelopmentSignatureAdapter implements ESignatureProvider {
  public readonly providerName = 'alongby_dev_simulation' as const;
  public readonly isSimulationMode = true;
  public readonly isDevelopmentOnly = true;

  async createEnvelope(params: CreateEnvelopeParams): Promise<EnvelopeResult> {
    const timestamp = new Date().toISOString();
    const envelopeId = `env_sim_${params.contractNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;

    const signers: ContractSigner[] = params.signers.map((s, idx) => ({
      signerId: `signer_${idx + 1}_${s.userId}`,
      userId: s.userId,
      role: s.role,
      name: s.name,
      email: s.email,
      status: 'pending',
    }));

    const auditEntry: ContractAuditEntry = {
      timestamp,
      action: 'DEV_SIM_ENVELOPE_CREATED',
      actor: 'System / Alongby Dev E-Signature Simulation',
      actorRole: 'system',
      details: `[Dev Simulation] Envelope ${envelopeId} dispatched to ${signers.length} signers. Document hash: ${params.documentFingerprint.substring(0, 16)}...`,
    };

    return {
      envelopeId,
      provider: this.providerName,
      mode: 'test_simulation',
      status: 'sent',
      providerNotice:
        'DEVELOPMENT TEST SIMULATION ONLY: This is an internal simulation adapter for testing and review. It is not a legally binding e-signature service. Production requires an external certified provider.',
      signers,
      createdAt: timestamp,
      auditEntry,
    };
  }

  async submitSignature(
    currentSigners: ContractSigner[],
    params: SignActionParams,
    actorName: string,
    actorRole: 'client' | 'professional'
  ): Promise<EnvelopeUpdateResult> {
    const timestamp = new Date().toISOString();
    // Simulated token clearly marked as development-only
    const verificationCode = `SIM-DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    let signerFound = false;
    const updatedSigners: ContractSigner[] = currentSigners.map((signer) => {
      if (signer.signerId === params.signerId || signer.userId === params.signerId) {
        signerFound = true;
        return {
          ...signer,
          status: 'signed' as const,
          signedAt: timestamp,
          typedSignature: params.typedSignature,
          // Explicitly avoid claiming server-verified IP in client simulation
          ipAddress: params.ipAddress ? `Client-Reported: ${params.ipAddress}` : '[Dev Simulation — No Server IP]',
          userAgent: params.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Client Browser'),
          verificationCode,
        };
      }
      return signer;
    });

    if (!signerFound) {
      throw new Error(`Signer ${params.signerId} was not found on this contract envelope.`);
    }

    const allSigned = updatedSigners.every((s) => s.status === 'signed');
    const newStatus = allSigned ? ('completed' as const) : ('partially_signed' as const);

    const auditEntry: ContractAuditEntry = {
      timestamp,
      action: allSigned ? 'DEV_SIM_CONTRACT_EXECUTED' : 'DEV_SIM_SIGNATURE_RECORDED',
      actor: actorName,
      actorRole,
      details: `[Dev Simulation] Signature recorded for ${actorName} (${actorRole.toUpperCase()}). Sim-Code: ${verificationCode}. Envelope state: ${newStatus}.`,
      ipAddress: params.ipAddress || '[Dev Simulation]',
    };

    return {
      envelopeId: '',
      status: newStatus,
      updatedSigners,
      completedAt: allSigned ? timestamp : undefined,
      auditEntry,
    };
  }
}

export const defaultSignatureAdapter = new AlongbyDevelopmentSignatureAdapter();
