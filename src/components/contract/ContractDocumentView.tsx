import React, { useState } from 'react';
import { Contract, UserRole } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building,
  User,
  Hash,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  Lock,
} from 'lucide-react';

interface ContractDocumentViewProps {
  contract: Contract;
  userRole: UserRole;
  userId: string;
  onExecuteSignature: (typedSignature: string) => Promise<void>;
  isSigning?: boolean;
}

export const ContractDocumentView: React.FC<ContractDocumentViewProps> = ({
  contract,
  userRole,
  userId,
  onExecuteSignature,
  isSigning = false,
}) => {
  const [typedSignature, setTypedSignature] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isClient = userRole === 'client';
  const isProfessional = userRole === 'professional';
  const isAdmin = userRole === 'admin';

  // Identify signer status
  const clientSigner = contract.eSignature.signers.find((s) => s.role === 'client');
  const profSigner = contract.eSignature.signers.find((s) => s.role === 'professional');

  const isClientSigned = clientSigner?.status === 'signed';
  const isProfSigned = profSigner?.status === 'signed';
  const isFullySigned = contract.status === 'fully_signed';

  const currentUserSigner = contract.eSignature.signers.find((s) => s.userId === userId);
  const hasCurrentUserSigned = currentUserSigner?.status === 'signed';

  const canSign =
    ((isClient && !isClientSigned) ||
      (isProfessional && !isProfSigned) ||
      (isAdmin && !hasCurrentUserSigned)) &&
    !isFullySigned;

  const handleSign = async () => {
    setErrorMsg('');
    if (!agreedTerms) {
      setErrorMsg('You must agree to the legally binding terms and electronic execution.');
      return;
    }
    if (!typedSignature.trim()) {
      setErrorMsg('Please enter your full legal name to generate your electronic signature.');
      return;
    }

    try {
      await onExecuteSignature(typedSignature.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Electronic signature execution failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currency = contract.proposalSnapshot.commercialTerms.currency;
  const totalAmountFormatted = `${(contract.proposalSnapshot.commercialTerms.totalAmountMinor / 100).toLocaleString(
    'en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )} ${currency}`;

  const phase1Formatted = `${(contract.proposalSnapshot.commercialTerms.phase1AmountMinor / 100).toLocaleString(
    'en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )} ${currency}`;

  const phase2Formatted = `${(contract.proposalSnapshot.commercialTerms.phase2AmountMinor / 100).toLocaleString(
    'en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )} ${currency}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Simulation / Development Notice Banner */}
      <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-[var(--radius-card)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-warning-text)] print:hidden">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong className="font-semibold">Electronic Signature Gateway ({contract.eSignature.provider}):</strong>{' '}
            {contract.eSignature.providerNotice}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="white"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />}
          >
            Print / PDF Export
          </Button>
        </div>
      </div>

      {/* Contract Formal Header */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                ALONGBY MASTER SERVICES AGREEMENT
              </span>
              {isFullySigned ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fully Executed
                </Badge>
              ) : (
                <Badge variant="info" size="md">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Awaiting Signatures
                </Badge>
              )}
            </div>
            <h1 className="typo-page-title text-[var(--color-text-primary)] tabular-nums">
              Contract Ref: {contract.contractNumber}
            </h1>
            <p className="text-[13px] text-[var(--color-text-secondary)] tabular-nums">
              Project: <span className="font-semibold text-[var(--color-text-primary)]">{contract.projectTitle}</span>{' '}
              · Generated: {new Date(contract.generatedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="sm:text-right space-y-1 text-xs text-[var(--color-text-secondary)] tabular-nums shrink-0">
            <div>Template: {contract.templateVersion}</div>
            <div>Terms: {contract.termsVersion}</div>
            <div className="truncate max-w-xs" title={contract.documentFingerprint}>
              SHA-256: {contract.documentFingerprint.substring(0, 16)}...
            </div>
          </div>
        </div>

        {/* Parties Identification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-2">
              Party A — Client
            </span>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span>{contract.clientSnapshot.fullName}</span>
              </div>
              {contract.clientSnapshot.companyName && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Company: {contract.clientSnapshot.companyName}
                </div>
              )}
              <div className="text-xs text-[var(--color-text-secondary)]">
                Jurisdiction: {contract.clientSnapshot.country}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-2">
              Party B — Independent Specialist
            </span>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Building className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span>{contract.professionalSnapshot.fullName}</span>
              </div>
              {contract.professionalSnapshot.companyName && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Entity/Title: {contract.professionalSnapshot.companyName}
                </div>
              )}
              <div className="text-xs text-[var(--color-text-secondary)]">
                Jurisdiction: {contract.professionalSnapshot.country}
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Summary Banner */}
        <div className="p-5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-[var(--color-primary-text)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 tabular-nums">
          <div>
            <span className="text-xs font-medium text-[#D6D3CD] uppercase tracking-wider block">
              Total Contract Consideration
            </span>
            <span className="text-2xl font-bold font-sans">{totalAmountFormatted}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#D6D3CD]">
            <div>
              <span className="block">
                Phase 1 ({contract.proposalSnapshot.commercialTerms.phase1Percentage ?? 50}% Staged Payment Hold)
              </span>
              <span className="font-semibold text-sm text-white">{phase1Formatted}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/15" />
            <div>
              <span className="block">
                Phase 2 ({contract.proposalSnapshot.commercialTerms.phase2Percentage ?? 50}% Final Balance)
              </span>
              <span className="font-semibold text-sm text-white">{phase2Formatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Legal Clauses */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <h2 className="typo-section-heading text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3">
          Terms & Conditions of Services
        </h2>

        <div className="space-y-6">
          {contract.legalSections.map((sec) => (
            <div key={sec.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xs font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {sec.sectionNumber}
                </span>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{sec.title}</h3>
              </div>
              <div className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line bg-[var(--color-surface-secondary)] p-4 rounded-[var(--radius-button)] font-sans">
                {sec.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule A: Deliverables & Milestones Snapshot */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-4">
        <h2 className="typo-section-heading text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3 tabular-nums">
          Schedule A: Scope & Milestones (Accepted Proposal Snapshot v{contract.proposalVersion})
        </h2>

        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-4 rounded-[var(--radius-button)] leading-relaxed">
            <strong className="block mb-1 text-[var(--color-text-primary)]">Agreed Scope Summary</strong>
            {contract.proposalSnapshot.scopeSummary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.proposalSnapshot.deliverables.map((del) => (
              <div key={del.id} className="p-4 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] text-[10px] font-bold tabular-nums flex items-center justify-center shrink-0">
                    {del.phase}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{del.title}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">{del.description}</p>
                <div className="text-[11px] font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Acceptance Criteria
                </div>
                <ul className="space-y-1">
                  {del.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5">
                      <span className="text-[var(--color-success)] font-bold">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Electronic Execution & Signatures Section */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border-strong)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <div className="border-b border-[var(--color-border)] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="typo-section-heading text-[var(--color-text-primary)] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
              <span>Electronic Signatures & Verification</span>
            </h2>
            <span className="text-xs font-sans font-medium tabular-nums text-[var(--color-text-secondary)]">
              Envelope ID: {contract.eSignature.envelopeId}
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Signatures recorded in development mode simulate electronic execution for review and testing. In production, this workflow connects to a certified external electronic signature provider.
          </p>
        </div>

        {/* Signatures Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Signer Box */}
          <div
            className={`p-5 rounded-[var(--radius-button)] border ${
              isClientSigned
                ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)]'
                : 'border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Client Signatory
              </span>
              {isClientSigned ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Executed (Simulated)
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Pending Execution
                </Badge>
              )}
            </div>

            {isClientSigned ? (
              <div className="space-y-2">
                <div className="font-serif font-semibold text-xl text-[var(--color-text-primary)] border-b border-[var(--color-success-border)] pb-2 break-words">
                  {clientSigner?.typedSignature || clientSigner?.name}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] space-y-0.5 font-sans tabular-nums">
                  <div>Signer: <span className="font-medium text-[var(--color-text-primary)]">{clientSigner?.name}</span></div>
                  <div>
                    Timestamp:{' '}
                    {new Date(clientSigner!.signedAt!).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>Sim-Code: {clientSigner?.verificationCode}</div>
                  <div>Address: {clientSigner?.ipAddress}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)] space-y-1">
                <Clock className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-1" />
                <p className="font-medium text-[var(--color-text-primary)]">Awaiting signature from Client</p>
                <p>{clientSigner?.name}</p>
              </div>
            )}
          </div>

          {/* Specialist Signer Box */}
          <div
            className={`p-5 rounded-[var(--radius-button)] border ${
              isProfSigned
                ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)]'
                : 'border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Specialist Signatory
              </span>
              {isProfSigned ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Executed (Simulated)
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Pending Execution
                </Badge>
              )}
            </div>

            {isProfSigned ? (
              <div className="space-y-2">
                <div className="font-serif font-semibold text-xl text-[var(--color-text-primary)] border-b border-[var(--color-success-border)] pb-2 break-words">
                  {profSigner?.typedSignature || profSigner?.name}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] space-y-0.5 font-sans tabular-nums">
                  <div>Signer: <span className="font-medium text-[var(--color-text-primary)]">{profSigner?.name}</span></div>
                  <div>
                    Timestamp:{' '}
                    {new Date(profSigner!.signedAt!).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>Sim-Code: {profSigner?.verificationCode}</div>
                  <div>Address: {profSigner?.ipAddress}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)] space-y-1">
                <Clock className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-1" />
                <p className="font-medium text-[var(--color-text-primary)]">Awaiting signature from Specialist</p>
                <p>{profSigner?.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Action Box (for current user) */}
        {canSign && (
          <div className="p-5 sm:p-6 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-4 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="typo-card-title text-[var(--color-text-primary)]">
                Execute Signature as {isClient ? 'Client' : isProfessional ? 'Specialist' : 'Authorized Signatory'}
              </h3>
              <Badge variant="warning" size="sm">
                Development Simulation Mode
              </Badge>
            </div>

            <p className="text-xs text-[var(--color-warning-text)] bg-[var(--color-warning-bg)] p-3.5 rounded-[var(--radius-button)] border border-[var(--color-warning-border)] leading-relaxed">
              <strong>Development Notice:</strong> Typing your name below simulates electronic signature execution via AlongbyDevelopmentSignatureAdapter. In a production environment, this triggers an external certified e-signature envelope via DocuSign or HelloSign.
            </p>

            {errorMsg && (
              <div className="p-3.5 rounded-[var(--radius-button)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)] rounded border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                />
                <span className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                  I acknowledge and approve the terms of this Master Services Agreement ({contract.contractNumber})
                  and all incorporated Schedules, including the staged payment protection terms. I acknowledge that my typed signature below is recorded under development simulation.
                </span>
              </label>

              <div>
                <label className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
                  Type Your Full Legal Name [Dev Simulation]
                </label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder={currentUserSigner?.name || 'e.g. Jane Doe'}
                  className="w-full max-w-md px-3.5 py-2.5 min-h-[40px] font-sans text-sm font-normal text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-input)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleSign}
                  disabled={isSigning || !agreedTerms || !typedSignature.trim()}
                >
                  {isSigning ? 'Recording Test Signature...' : 'Execute Test Signature (Dev Simulation)'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Fully Signed Next Steps Banner */}
        {isFullySigned && (
          <div className="p-5 rounded-[var(--radius-button)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success-text)] flex-shrink-0" />
              <h3 className="text-sm font-bold text-[var(--color-success-text)]">
                Agreement Fully Executed by Both Parties
              </h3>
            </div>
            <p className="text-xs text-[var(--color-success-text)] leading-relaxed">
              Master Services Contract {contract.contractNumber} has been countersigned by both Client and Specialist.
              In accordance with platform governance, the project state is now <strong>awaiting_deposit</strong>.
              Execution kickoff will commence immediately upon Phase 1 staged payment deposit funding (Phase 6).
            </p>
          </div>
        )}

        {/* Audit Trail Drawer Toggle */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            aria-expanded={showAuditTrail}
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
          >
            <History className="w-3.5 h-3.5" />
            <span>
              {showAuditTrail ? 'Hide Document Hash & Simulation Audit Log' : 'View Document Hash & Simulation Audit Log'}
            </span>
            {showAuditTrail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAuditTrail && (
            <div className="mt-3 p-4 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-[#E5E3DF] font-sans tabular-nums text-xs space-y-2">
              <div className="text-[#A8A39D] text-[11px] pb-1.5 border-b border-white/10 break-all">
                Document Hash: {contract.documentFingerprint}
              </div>
              {contract.eSignature.auditLog.map((entry, idx) => (
                <div key={idx} className="space-y-0.5 border-b border-white/10 pb-1.5 last:border-b-0">
                  <div className="text-[#A8A39D] text-[11px]">
                    [{new Date(entry.timestamp).toISOString()}] — {entry.action}
                  </div>
                  <div className="text-[#A7F3D0] font-medium">
                    {entry.actor} ({entry.actorRole})
                  </div>
                  {entry.details && <div className="text-[#E5E3DF]">{entry.details}</div>}
                  {entry.ipAddress && (
                    <div className="text-[#A8A39D] text-[11px]">Host: {entry.ipAddress}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
