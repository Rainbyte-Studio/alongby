import React, { useState } from 'react';
import { Contract, UserRole } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import {
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building,
  User,
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

const ACTIVATION_STAGES = [
  {
    step: 1,
    title: 'Agreement Signed',
    detail: 'Both Client and Specialist execute the Master Services Agreement.',
  },
  {
    step: 2,
    title: 'Awaiting Phase 1 Deposit',
    detail: 'Engagement enters awaiting_deposit status prior to kickoff.',
  },
  {
    step: 3,
    title: 'Deposit Confirmation',
    detail: 'Phase 1 deposit payment is verified (Phase 6 payment gateway).',
  },
  {
    step: 4,
    title: 'Project Activation',
    detail: 'Phase 1 milestone delivery activates only after deposit confirmation.',
  },
  {
    step: 5,
    title: 'Completion-Stage Payment',
    detail: 'Phase 2 balance applies upon final deliverable inspection and sign-off.',
  },
];

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
  const isSimulationMode =
    contract.eSignature.mode === 'test_simulation' || contract.eSignature.isDevelopmentOnly;

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
      setErrorMsg('Please confirm your agreement to the Master Services Agreement terms.');
      return;
    }
    if (!typedSignature.trim()) {
      setErrorMsg('Please enter your full legal name to record your signature.');
      return;
    }

    try {
      await onExecuteSignature(typedSignature.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Signature recording failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currency = contract.proposalSnapshot.commercialTerms.currency;
  const totalAmountFormatted = `${(
    contract.proposalSnapshot.commercialTerms.totalAmountMinor / 100
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

  const phase1Formatted = `${(
    contract.proposalSnapshot.commercialTerms.phase1AmountMinor / 100
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

  const phase2Formatted = `${(
    contract.proposalSnapshot.commercialTerms.phase2AmountMinor / 100
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Simulation / Development Notice Banner */}
      <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-[var(--radius-card)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-warning-text)] print:hidden">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <strong className="font-semibold">
              {isSimulationMode
                ? 'Platform Simulation Mode (Development / Review Only):'
                : `Electronic Signature Gateway (${contract.eSignature.provider}):`}
            </strong>{' '}
            {isSimulationMode
              ? 'Typed signatures on this screen are recorded as internal development acceptance records and are not verified by an external cryptographic certificate authority.'
              : contract.eSignature.providerNotice}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="white"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Contract Formal Header */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-semibold text-[var(--color-text-secondary)]">
                Alongby Master Services Agreement
              </span>
              {isFullySigned ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Signed by Both Parties
                </Badge>
              ) : (
                <Badge variant="info" size="md">
                  <Clock className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Awaiting Signatures
                </Badge>
              )}
            </div>
            <h1 className="typo-page-title text-[var(--color-text-primary)] tabular-nums break-words">
              Agreement {contract.contractNumber}
            </h1>
            <p className="text-[13px] text-[var(--color-text-secondary)] tabular-nums">
              Project:{' '}
              <span className="font-semibold text-[var(--color-text-primary)]">
                {contract.projectTitle}
              </span>{' '}
              · Generated {new Date(contract.generatedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="sm:text-right space-y-1 text-xs text-[var(--color-text-secondary)] tabular-nums shrink-0">
            <div>Template: {contract.templateVersion}</div>
            <div>Terms: {contract.termsVersion}</div>
            <div className="truncate max-w-xs" title={contract.documentFingerprint}>
              Document Hash: {contract.documentFingerprint.substring(0, 16)}…
            </div>
          </div>
        </div>

        {/* Parties Identification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">
              Party A — Client
            </span>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                <span>{contract.clientSnapshot.fullName}</span>
              </div>
              {contract.clientSnapshot.companyName && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Organization: {contract.clientSnapshot.companyName}
                </div>
              )}
              <div className="text-xs text-[var(--color-text-secondary)]">
                Jurisdiction: {contract.clientSnapshot.country}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)]">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">
              Party B — Independent Specialist
            </span>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Building className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                <span>{contract.professionalSnapshot.fullName}</span>
              </div>
              {contract.professionalSnapshot.companyName && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Practice / Title: {contract.professionalSnapshot.companyName}
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
            <span className="text-xs font-medium text-white/75 block">
              Total Contract Consideration
            </span>
            <span className="text-2xl font-bold font-sans">{totalAmountFormatted}</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-white/75">
            <div>
              <span className="block">
                Phase 1 Deposit ({contract.proposalSnapshot.commercialTerms.phase1Percentage ?? 50}% — Due Prior to Activation)
              </span>
              <span className="font-semibold text-sm text-[var(--color-primary-text)]">
                {phase1Formatted}
              </span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/15" />
            <div>
              <span className="block">
                Phase 2 Balance ({contract.proposalSnapshot.commercialTerms.phase2Percentage ?? 50}% — Due Upon Completion)
              </span>
              <span className="font-semibold text-sm text-[var(--color-primary-text)]">
                {phase2Formatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Legal Clauses */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <h2 className="typo-section-heading text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3">
          Terms &amp; Conditions of Services
        </h2>

        <div className="space-y-6">
          {contract.legalSections.map((sec) => (
            <div key={sec.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xs font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {sec.sectionNumber}
                </span>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {sec.title}
                </h3>
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
          Schedule A: Scope &amp; Milestones (Accepted Proposal Snapshot v{contract.proposalVersion})
        </h2>

        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-4 rounded-[var(--radius-button)] leading-relaxed">
            <strong className="block mb-1 text-[var(--color-text-primary)]">
              Agreed Scope Summary
            </strong>
            {contract.proposalSnapshot.scopeSummary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.proposalSnapshot.deliverables.map((del) => (
              <div
                key={del.id}
                className="p-4 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] text-[10px] font-bold tabular-nums flex items-center justify-center shrink-0">
                    {del.phase}
                  </span>
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {del.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                  {del.description}
                </p>
                <div className="text-[11px] font-semibold text-[var(--color-text-primary)] mb-1">
                  Acceptance Criteria
                </div>
                <ul className="space-y-1">
                  {del.acceptanceCriteria.map((c, i) => (
                    <li
                      key={i}
                      className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5"
                    >
                      <span className="text-[var(--color-success)] font-bold" aria-hidden="true">
                        ✓
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signatures & Activation Progression Section */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border-strong)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <div className="border-b border-[var(--color-border)] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="typo-section-heading text-[var(--color-text-primary)] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
              <span>Dual-Party Signatures &amp; Acceptance Record</span>
            </h2>
            <span className="text-xs font-sans font-medium tabular-nums text-[var(--color-text-secondary)]">
              Record ID: {contract.eSignature.envelopeId}
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            {isSimulationMode
              ? 'This environment uses the platform development signature adapter to simulate dual-party execution for workflow review. Production deployments connect to an external e-signature provider.'
              : contract.eSignature.providerNotice}
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
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Client Signatory
              </span>
              {isClientSigned ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                  {isSimulationMode ? 'Signed (Simulated)' : 'Signed'}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Pending Signature
                </Badge>
              )}
            </div>

            {isClientSigned ? (
              <div className="space-y-2">
                <div className="font-serif font-semibold text-xl text-[var(--color-text-primary)] border-b border-[var(--color-success-border)] pb-2 break-words">
                  {clientSigner?.typedSignature || clientSigner?.name}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] space-y-0.5 font-sans tabular-nums">
                  <div>
                    Signer:{' '}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {clientSigner?.name}
                    </span>
                  </div>
                  <div>
                    Timestamp:{' '}
                    {new Date(clientSigner!.signedAt!).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>Reference: {clientSigner?.verificationCode}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)] space-y-1">
                <Clock className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-1" aria-hidden="true" />
                <p className="font-medium text-[var(--color-text-primary)]">
                  Awaiting Client signature
                </p>
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
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Specialist Signatory
              </span>
              {isProfSigned ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                  {isSimulationMode ? 'Signed (Simulated)' : 'Signed'}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Pending Signature
                </Badge>
              )}
            </div>

            {isProfSigned ? (
              <div className="space-y-2">
                <div className="font-serif font-semibold text-xl text-[var(--color-text-primary)] border-b border-[var(--color-success-border)] pb-2 break-words">
                  {profSigner?.typedSignature || profSigner?.name}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] space-y-0.5 font-sans tabular-nums">
                  <div>
                    Signer:{' '}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {profSigner?.name}
                    </span>
                  </div>
                  <div>
                    Timestamp:{' '}
                    {new Date(profSigner!.signedAt!).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>Reference: {profSigner?.verificationCode}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)] space-y-1">
                <Clock className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-1" aria-hidden="true" />
                <p className="font-medium text-[var(--color-text-primary)]">
                  Awaiting Specialist signature
                </p>
                <p>{profSigner?.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Action Box (for current user) */}
        {canSign && (
          <div className="p-5 sm:p-6 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-4 mt-6 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="typo-card-title text-[var(--color-text-primary)]">
                Record Signature as{' '}
                {isClient ? 'Client' : isProfessional ? 'Specialist' : 'Authorized Signatory'}
              </h3>
              {isSimulationMode && (
                <Badge variant="warning" size="sm">
                  Simulation Mode
                </Badge>
              )}
            </div>

            {isSimulationMode && (
              <Alert variant="warning">
                <strong>Development Simulation:</strong> Typing your name below records a simulated acceptance entry via the development adapter. It does not invoke an external production e-signature provider.
              </Alert>
            )}

            {errorMsg && (
              <Alert variant="error" onDismiss={() => setErrorMsg('')}>
                {errorMsg}
              </Alert>
            )}

            <div className="space-y-4">
              <Checkbox
                id="contract-agree-checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                label={`I have reviewed Master Services Agreement ${contract.contractNumber} and Schedule A, and confirm acceptance of all terms, deliverables, and two-stage payment milestones${
                  isSimulationMode ? ' (recorded in development simulation mode)' : ''
                }.`}
              />

              <div className="max-w-md">
                <Input
                  id="contract-typed-signature"
                  label={
                    isSimulationMode
                      ? 'Typed Full Legal Name (Simulation Signature)'
                      : 'Typed Full Legal Name'
                  }
                  required
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder={currentUserSigner?.name || 'e.g. Jane Doe'}
                />
              </div>

              <div className="pt-1">
                <Button
                  variant="primary"
                  onClick={handleSign}
                  isLoading={isSigning}
                  disabled={isSigning || !agreedTerms || !typedSignature.trim()}
                >
                  {isSigning
                    ? 'Recording Signature…'
                    : isSimulationMode
                    ? 'Record Simulated Signature'
                    : 'Sign Agreement'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payment & Project Activation Progression (Section 3.7) */}
        <div className="pt-6 border-t border-[var(--color-border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="typo-card-title text-[var(--color-text-primary)]">
                Deposit &amp; Project Activation Progression
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Projects never transition to active delivery until both parties have signed and the Phase 1 deposit stage is confirmed.
              </p>
            </div>
            {isFullySigned ? (
              <Badge variant="warning" size="sm">
                Current Stage: Awaiting Phase 1 Deposit
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Current Stage: Awaiting Dual Signatures
              </Badge>
            )}
          </div>

          {isFullySigned && (
            <Alert variant="success" title="Both Signatures Recorded — Awaiting Phase 1 Deposit">
              Master Services Agreement <strong className="tabular-nums">{contract.contractNumber}</strong> is signed by both Client and Specialist. The project status is now <strong>awaiting_deposit</strong> ({phase1Formatted}). Project delivery activates only once Phase 1 deposit confirmation is completed.
            </Alert>
          )}

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ACTIVATION_STAGES.map((item) => {
              const isDone = isFullySigned && item.step === 1;
              const isCurrent =
                (!isFullySigned && item.step === 1) || (isFullySigned && item.step === 2);

              return (
                <li
                  key={item.step}
                  className={`p-3.5 rounded-[var(--radius-button)] border text-xs space-y-1 ${
                    isCurrent
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface)] ring-1 ring-[var(--color-primary)]'
                      : isDone
                      ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 tabular-nums">
                    <span className="font-semibold text-[var(--color-text-secondary)]">
                      0{item.step}
                    </span>
                    {isDone && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-[var(--color-success-text)] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {isCurrent && (
                      <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-[var(--color-text-primary)]">{item.title}</div>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">{item.detail}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Audit Trail Drawer Toggle */}
        <div className="pt-4 border-t border-[var(--color-border)] print:hidden">
          <button
            type="button"
            aria-expanded={showAuditTrail}
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {showAuditTrail
                ? 'Hide Document Hash & Acceptance Audit Log'
                : 'View Document Hash & Acceptance Audit Log'}
            </span>
            {showAuditTrail ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {showAuditTrail && (
            <div className="mt-3 p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] font-sans tabular-nums text-xs space-y-2.5">
              <div className="text-[var(--color-text-secondary)] text-[11px] pb-2 border-b border-[var(--color-border)] break-all">
                Document SHA-256 Fingerprint:{' '}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {contract.documentFingerprint}
                </span>
              </div>
              {contract.eSignature.auditLog.map((entry, idx) => (
                <div
                  key={idx}
                  className="space-y-0.5 border-b border-[var(--color-border)] pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="text-[var(--color-text-secondary)] text-[11px]">
                    [{new Date(entry.timestamp).toISOString()}] — {entry.action}
                  </div>
                  <div className="text-[var(--color-text-primary)] font-semibold">
                    {entry.actor} ({entry.actorRole})
                  </div>
                  {entry.details && (
                    <div className="text-[var(--color-text-secondary)]">{entry.details}</div>
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
