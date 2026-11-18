import { ContractSigner, ContractAuditEntry } from '../../types';

export interface CreateSignerInput {
  userId: string;
  role: 'client' | 'professional';
  name: string;
  email: string;
}

export interface CreateEnvelopeParams {
  contractId: string;
  contractNumber: string;
  documentTitle: string;
  documentFingerprint: string;
  signers: CreateSignerInput[];
}

export interface EnvelopeResult {
  envelopeId: string;
  provider: 'alongby_dev_simulation' | 'alongby_esignature_v1' | 'docusign' | 'hellosign';
  mode: 'test_simulation' | 'production';
  status: 'created' | 'sent';
  providerNotice: string;
  signers: ContractSigner[];
  createdAt: string;
  auditEntry: ContractAuditEntry;
}

export interface SignActionParams {
  signerId: string;
  typedSignature: string;
  ipAddress?: string;
  userAgent?: string;
  verificationCode?: string;
}

export interface EnvelopeUpdateResult {
  envelopeId: string;
  status: 'partially_signed' | 'completed' | 'declined';
  updatedSigners: ContractSigner[];
  completedAt?: string;
  auditEntry: ContractAuditEntry;
}

/**
 * ESignatureProvider interface for electronic signature gateways (DocuSign, HelloSign, Alongby Adapter).
 * This abstraction decouples Alongby contract state management from specific external signature vendors.
 */
export interface ESignatureProvider {
  readonly providerName: 'alongby_dev_simulation' | 'alongby_esignature_v1' | 'docusign' | 'hellosign';
  readonly isSimulationMode: boolean;

  createEnvelope(params: CreateEnvelopeParams): Promise<EnvelopeResult>;
  submitSignature(
    currentSigners: ContractSigner[],
    params: SignActionParams,
    actorName: string,
    actorRole: 'client' | 'professional'
  ): Promise<EnvelopeUpdateResult>;
}
