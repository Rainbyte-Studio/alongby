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
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 print:hidden">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong className="font-semibold">Electronic Signature Gateway ({contract.eSignature.provider}):</strong>{' '}
            {contract.eSignature.providerNotice}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1 bg-white hover:bg-neutral-50"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-600" />
            <span>Print / PDF Export</span>
          </Button>
        </div>
      </div>

      {/* Contract Formal Header */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
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
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              Contract Ref: {contract.contractNumber}
            </h1>
            <p className="text-xs text-neutral-500">
              Project: <span className="font-medium text-neutral-700">{contract.projectTitle}</span>{' '}
              • Generated: {new Date(contract.generatedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right space-y-1 text-xs text-neutral-500 font-mono">
            <div>Template: {contract.templateVersion}</div>
            <div>Terms: {contract.termsVersion}</div>
            <div className="truncate max-w-xs" title={contract.documentFingerprint}>
              SHA-256: {contract.documentFingerprint.substring(0, 16)}...
            </div>
          </div>
        </div>

        {/* Parties Identification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
              Party A — Client
            </span>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-neutral-900 flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500" />
                <span>{contract.clientSnapshot.fullName}</span>
              </div>
              {contract.clientSnapshot.companyName && (
                <div className="text-xs text-neutral-600">
                  Company: {contract.clientSnapshot.companyName}
                </div>
              )}
              <div className="text-xs text-neutral-500">
                Jurisdiction: {contract.clientSnapshot.country}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
              Party B — Independent Specialist
            </span>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-neutral-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-neutral-500" />
                <span>{contract.professionalSnapshot.fullName}</span>
              </div>
              {contract.professionalSnapshot.companyName && (
                <div className="text-xs text-neutral-600">
                  Entity/Title: {contract.professionalSnapshot.companyName}
                </div>
              )}
              <div className="text-xs text-neutral-500">
                Jurisdiction: {contract.professionalSnapshot.country}
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Summary Banner */}
        <div className="p-4 rounded-lg bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">
              Total Contract Consideration
            </span>
            <span className="text-2xl font-bold">{totalAmountFormatted}</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-300">
            <div>
              <span className="text-neutral-400 block">
                Phase 1 ({contract.proposalSnapshot.commercialTerms.phase1Percentage ?? 50}% Staged Payment Hold)
              </span>
              <span className="font-semibold text-white">{phase1Formatted}</span>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div>
              <span className="text-neutral-400 block">
                Phase 2 ({contract.proposalSnapshot.commercialTerms.phase2Percentage ?? 50}% Final Balance)
              </span>
              <span className="font-semibold text-white">{phase2Formatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Legal Clauses */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-3">
          Terms & Conditions of Services
        </h2>

        <div className="space-y-6">
          {contract.legalSections.map((sec) => (
            <div key={sec.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-neutral-500">
                  {sec.sectionNumber}
                </span>
                <h3 className="text-sm font-semibold text-neutral-900">{sec.title}</h3>
              </div>
              <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line bg-neutral-50/50 p-3.5 rounded border border-neutral-100 font-sans">
                {sec.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule A: Deliverables & Milestones Snapshot */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-3">
          Schedule A: Scope & Milestones (Accepted Proposal Snapshot v{contract.proposalVersion})
        </h2>

        <div className="space-y-4">
          <div className="text-xs text-neutral-700 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <strong className="block mb-1 text-neutral-900">Agreed Scope Summary:</strong>
            {contract.proposalSnapshot.scopeSummary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.proposalSnapshot.deliverables.map((del) => (
              <div key={del.id} className="p-4 rounded-lg border border-neutral-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {del.phase}
                  </span>
                  <span className="text-xs font-semibold text-neutral-900">{del.title}</span>
                </div>
                <p className="text-xs text-neutral-600 mb-3">{del.description}</p>
                <div className="text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  Acceptance Criteria
                </div>
                <ul className="space-y-1">
                  {del.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
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
      <div className="bg-white rounded-xl border-2 border-neutral-900 shadow-md p-6 sm:p-8 space-y-6">
        <div className="border-b border-neutral-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-neutral-800" />
              <span>Electronic Signatures & Verification</span>
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              Envelope ID: {contract.eSignature.envelopeId}
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            Signatures recorded in development mode simulate electronic execution for review and testing. In production, this workflow connects to a certified external electronic signature provider.
          </p>
        </div>

        {/* Signatures Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Signer Box */}
          <div
            className={`p-5 rounded-lg border-2 ${
              isClientSigned
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-dashed border-neutral-300 bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
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
                <div className="font-serif italic text-xl text-neutral-900 border-b border-emerald-200 pb-2">
                  {clientSigner?.typedSignature || clientSigner?.name}
                </div>
                <div className="text-xs text-neutral-600 space-y-0.5 font-mono">
                  <div>Signer: {clientSigner?.name}</div>
                  <div>
                    Timestamp:{' '}
                    {new Date(clientSigner!.signedAt!).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>Sim-Code: {clientSigner?.verificationCode}</div>
                  <div className="text-[10px] text-neutral-400">Address: {clientSigner?.ipAddress}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-500 space-y-1">
                <Clock className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                <p className="font-medium text-neutral-700">Awaiting signature from Client</p>
                <p className="text-neutral-400">{clientSigner?.name}</p>
              </div>
            )}
          </div>

          {/* Specialist Signer Box */}
          <div
            className={`p-5 rounded-lg border-2 ${
              isProfSigned
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-dashed border-neutral-300 bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
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
                <div className="font-serif italic text-xl text-neutral-900 border-b border-emerald-200 pb-2">
                  {profSigner?.typedSignature || profSigner?.name}
                </div>
                <div className="text-xs text-neutral-600 space-y-0.5 font-mono">
                  <div>Signer: {profSigner?.name}</div>
                  <div>
                    Timestamp:{' '}
                    {new Date(profSigner!.signedAt!).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </div>
                  <div>Sim-Code: {profSigner?.verificationCode}</div>
                  <div className="text-[10px] text-neutral-400">Address: {profSigner?.ipAddress}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-500 space-y-1">
                <Clock className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                <p className="font-medium text-neutral-700">Awaiting signature from Specialist</p>
                <p className="text-neutral-400">{profSigner?.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Action Box (for current user) */}
        {canSign && (
          <div className="p-5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                Execute Signature as {isClient ? 'Client' : isProfessional ? 'Specialist' : 'Authorized Signatory'}
              </h3>
              <Badge variant="warning" size="sm">
                Development Simulation Mode
              </Badge>
            </div>

            <p className="text-xs text-neutral-600 bg-amber-50/70 p-3 rounded border border-amber-200">
              <strong>Development Notice:</strong> Typing your name below simulates electronic signature execution via AlongbyDevelopmentSignatureAdapter. In a production environment, this triggers an external certified e-signature envelope via DocuSign or HelloSign.
            </p>

            {errorMsg && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
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
                  className="mt-1 h-4 w-4 text-neutral-900 rounded border-neutral-300 focus:ring-neutral-900"
                />
                <span className="text-xs text-neutral-700 leading-relaxed">
                  I acknowledge and approve the terms of this Master Services Agreement ({contract.contractNumber})
                  and all incorporated Schedules, including the staged payment protection terms. I acknowledge that my typed signature below is recorded under development simulation.
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Type Your Full Legal Name [Dev Simulation]
                </label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder={currentUserSigner?.name || 'e.g. Jane Doe'}
                  className="w-full max-w-md px-3 py-2 text-base font-serif border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleSign}
                  disabled={isSigning || !agreedTerms || !typedSignature.trim()}
                  className="shadow-sm"
                >
                  {isSigning ? 'Recording Test Signature...' : 'Execute Test Signature (Dev Simulation)'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Fully Signed Next Steps Banner */}
        {isFullySigned && (
          <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-300 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <h3 className="text-sm font-bold text-emerald-900">
                Agreement Fully Executed by Both Parties
              </h3>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Master Services Contract {contract.contractNumber} has been countersigned by both Client and Specialist.
              In accordance with platform governance, the project state is now <strong>awaiting_deposit</strong>.
              Execution kickoff will commence immediately upon Phase 1 staged payment deposit funding (Phase 6).
            </p>
          </div>
        )}

        {/* Audit Trail Drawer Toggle */}
        <div className="pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            <History className="w-3.5 h-3.5" />
            <span>
              {showAuditTrail ? 'Hide Document Hash & Simulation Audit Log' : 'View Document Hash & Simulation Audit Log'}
            </span>
            {showAuditTrail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAuditTrail && (
            <div className="mt-3 p-4 rounded-lg bg-neutral-900 text-neutral-200 font-mono text-xs space-y-2">
              <div className="text-neutral-400 text-[11px] pb-1 border-b border-neutral-800">
                Document Hash: {contract.documentFingerprint}
              </div>
              {contract.eSignature.auditLog.map((entry, idx) => (
                <div key={idx} className="space-y-0.5 border-b border-neutral-800/60 pb-1.5">
                  <div className="text-neutral-400 text-[10px]">
                    [{new Date(entry.timestamp).toISOString()}] — {entry.action}
                  </div>
                  <div className="text-emerald-400">
                    {entry.actor} ({entry.actorRole})
                  </div>
                  {entry.details && <div className="text-neutral-300">{entry.details}</div>}
                  {entry.ipAddress && (
                    <div className="text-neutral-500 text-[10px]">Host: {entry.ipAddress}</div>
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
