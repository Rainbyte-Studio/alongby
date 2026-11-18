import React, { useState } from 'react';
import {
  Proposal,
  ChangeRequestCategory,
  UserRole,
} from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { Modal } from '../ui/Modal';
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  MessageSquarePlus,
  RefreshCw,
  Check,
  User,
  Building,
} from 'lucide-react';

interface ProposalReviewViewProps {
  proposal: Proposal;
  userRole: UserRole;
  userId: string;
  onAcceptProposal: (typedName: string) => Promise<void>;
  onSubmitChangeRequest: (params: {
    category: ChangeRequestCategory;
    message: string;
    suggestedChanges?: { field: string; requestedValue: string; reason?: string }[];
  }) => Promise<void>;
  onNavigateToContract?: () => void;
  onPublishRevisedProposal?: (modifications: Partial<Proposal>) => Promise<void>;
  isAccepting?: boolean;
  isSubmittingChange?: boolean;
  isPublishingRevision?: boolean;
}

export const ProposalReviewView: React.FC<ProposalReviewViewProps> = ({
  proposal,
  userRole,
  onAcceptProposal,
  onSubmitChangeRequest,
  onPublishRevisedProposal,
  onNavigateToContract,
  isAccepting = false,
  isSubmittingChange = false,
  isPublishingRevision = false,
}) => {
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [changeCategory, setChangeCategory] = useState<ChangeRequestCategory>('scope');
  const [changeMessage, setChangeMessage] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [changeError, setChangeError] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [acceptError, setAcceptError] = useState('');

  // Revision modal states
  const [revScope, setRevScope] = useState(proposal.scopeSummary);
  const [revAmount, setRevAmount] = useState(
    (proposal.commercialTerms.totalAmountMinor / 100).toString()
  );
  const [revDuration, setRevDuration] = useState(
    proposal.commercialTerms.estimatedDurationDays.toString()
  );
  const [revNotes, setRevNotes] = useState('');
  const [revisionError, setRevisionError] = useState('');

  const isClient = userRole === 'client';
  const isProfessional = userRole === 'professional';
  const isAdmin = userRole === 'admin';

  const clientAccepted = Boolean(proposal.clientAcceptance?.accepted);
  const professionalAccepted = Boolean(proposal.professionalAcceptance?.accepted);
  const bothAccepted = proposal.status === 'accepted' || (clientAccepted && professionalAccepted);

  const canAccept =
    (isClient && !clientAccepted) ||
    (isProfessional && !professionalAccepted) ||
    isAdmin;

  const totalFormatted = `${(proposal.commercialTerms.totalAmountMinor / 100).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} ${proposal.commercialTerms.currency}`;

  const phase1Formatted = `${(proposal.commercialTerms.phase1AmountMinor / 100).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} ${proposal.commercialTerms.currency}`;

  const phase2Formatted = `${(proposal.commercialTerms.phase2AmountMinor / 100).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} ${proposal.commercialTerms.currency}`;

  const handleAccept = async () => {
    setAcceptError('');
    if (!agreeTerms) {
      setAcceptError('Please confirm agreement to the scope and commercial terms.');
      return;
    }
    if (!typedName.trim()) {
      setAcceptError('Please enter your full legal name to confirm acceptance.');
      return;
    }
    try {
      await onAcceptProposal(typedName.trim());
    } catch (err: any) {
      setAcceptError(err.message || 'Failed to record proposal acceptance.');
    }
  };

  const handleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    if (!changeMessage.trim()) {
      setChangeError('Please describe the adjustments you are requesting.');
      return;
    }

    try {
      await onSubmitChangeRequest({
        category: changeCategory,
        message: changeMessage.trim(),
        suggestedChanges: suggestedValue.trim()
          ? [{ field: changeCategory, requestedValue: suggestedValue.trim() }]
          : undefined,
      });
      setShowChangeModal(false);
      setChangeMessage('');
      setSuggestedValue('');
    } catch (err: any) {
      setChangeError(err.message || 'Failed to submit change request.');
    }
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevisionError('');
    if (!revScope.trim()) {
      setRevisionError('Scope summary cannot be empty.');
      return;
    }
    const numAmount = parseFloat(revAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setRevisionError('Please enter a valid positive commercial amount.');
      return;
    }
    const numDuration = parseInt(revDuration, 10);
    if (isNaN(numDuration) || numDuration <= 0) {
      setRevisionError('Please enter a valid estimated duration in days.');
      return;
    }

    try {
      const totalAmountMinor = Math.round(numAmount * 100);
      if (onPublishRevisedProposal) {
        await onPublishRevisedProposal({
          scopeSummary: revScope.trim(),
          commercialTerms: {
            ...proposal.commercialTerms,
            totalAmountMinor,
            estimatedDurationDays: numDuration,
          },
          executiveSummary: revNotes.trim()
            ? `Proposal v${proposal.version + 1} Revision: ${revNotes.trim()}`
            : proposal.executiveSummary,
        });
      }
      setShowRevisionModal(false);
    } catch (err: any) {
      setRevisionError(err.message || 'Failed to publish revised proposal.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" size="md" className="tabular-nums">
                Proposal v{proposal.version}
              </Badge>
              {bothAccepted ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Mutually Accepted
                </Badge>
              ) : proposal.status === 'changes_requested' ? (
                <Badge variant="warning" size="md">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Revisions Requested
                </Badge>
              ) : (
                <Badge variant="neutral" size="md">
                  <Clock className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Pending Mutual Acceptance
                </Badge>
              )}
            </div>
            <h1 className="typo-page-title text-[var(--color-text-primary)] pt-1 break-words">
              {proposal.title}
            </h1>
            <p className="text-[13px] text-[var(--color-text-secondary)] tabular-nums">
              Ref:{' '}
              <span className="font-medium text-[var(--color-text-primary)]">{proposal.id}</span> ·
              Formulated{' '}
              {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {bothAccepted && onNavigateToContract && (
              <Button
                variant="primary"
                onClick={onNavigateToContract}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Open Service Agreement
              </Button>
            )}

            {!bothAccepted && (
              <Button
                variant="outline"
                onClick={() => {
                  setChangeError('');
                  setShowChangeModal(true);
                }}
                leftIcon={
                  <MessageSquarePlus className="w-4 h-4 text-[var(--color-text-secondary)]" />
                }
              >
                Request Adjustments
              </Button>
            )}
          </div>
        </div>

        {/* Commercial Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] min-w-0">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
              Total Fee
            </span>
            <span className="text-xl sm:text-2xl font-bold font-sans tabular-nums text-[var(--color-text-primary)] mt-1 block break-words">
              {totalFormatted}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] mt-0.5 block">
              Fixed price for agreed scope
            </span>
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] min-w-0">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
              Phase 1 Kickoff Deposit
            </span>
            <span className="text-xl sm:text-2xl font-bold font-sans tabular-nums text-[var(--color-text-primary)] mt-1 block break-words">
              {phase1Formatted}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] mt-0.5 block tabular-nums">
              {proposal.commercialTerms.phase1Percentage ?? 50}% due after contract signing to activate delivery
            </span>
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] min-w-0">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
              Phase 2 Completion Payment
            </span>
            <span className="text-xl sm:text-2xl font-bold font-sans tabular-nums text-[var(--color-text-primary)] mt-1 block break-words">
              {phase2Formatted}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] mt-0.5 block tabular-nums">
              {proposal.commercialTerms.phase2Percentage ?? 50}% due upon final deliverable review
            </span>
          </div>

          <div className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] min-w-0">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
              Estimated Timeline
            </span>
            <span className="text-xl sm:text-2xl font-bold font-sans tabular-nums text-[var(--color-text-primary)] mt-1 block">
              {proposal.commercialTerms.estimatedDurationDays} Days
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] mt-0.5 block tabular-nums">
              Target start: {proposal.commercialTerms.proposedStartDate}
            </span>
          </div>
        </div>
      </div>

      {/* Acceptance Status Tracker Bar */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
        <h2 className="typo-card-title text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
          <span>Mutual Acceptance Status</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Acceptance */}
          <div
            className={`p-4 rounded-[var(--radius-button)] border transition-colors ${
              clientAccepted
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]'
                : 'bg-[var(--color-surface-secondary)] border-[var(--color-border)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Client Acceptance
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 tabular-nums">
                  {clientAccepted ? (
                    <>
                      Accepted by{' '}
                      <span className="font-semibold text-[var(--color-success-text)]">
                        {proposal.clientAcceptance?.acceptedByName}
                      </span>{' '}
                      on{' '}
                      {new Date(proposal.clientAcceptance!.acceptedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </>
                  ) : (
                    'Awaiting Client review and sign-off'
                  )}
                </p>
              </div>
              {clientAccepted ? (
                <Badge variant="success" size="sm">
                  <Check className="w-3 h-3 mr-1" aria-hidden="true" /> Agreed
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Pending
                </Badge>
              )}
            </div>
          </div>

          {/* Professional Acceptance */}
          <div
            className={`p-4 rounded-[var(--radius-button)] border transition-colors ${
              professionalAccepted
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]'
                : 'bg-[var(--color-surface-secondary)] border-[var(--color-border)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Specialist Acceptance
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 tabular-nums">
                  {professionalAccepted ? (
                    <>
                      Accepted by{' '}
                      <span className="font-semibold text-[var(--color-success-text)]">
                        {proposal.professionalAcceptance?.acceptedByName}
                      </span>{' '}
                      on{' '}
                      {new Date(proposal.professionalAcceptance!.acceptedAt).toLocaleString(
                        undefined,
                        {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }
                      )}
                    </>
                  ) : (
                    'Awaiting Specialist review and confirmation'
                  )}
                </p>
              </div>
              {professionalAccepted ? (
                <Badge variant="success" size="sm">
                  <Check className="w-3 h-3 mr-1" aria-hidden="true" /> Agreed
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </div>

        {bothAccepted && (
          <div className="mt-4 p-4 rounded-[var(--radius-button)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success-text)] shrink-0" aria-hidden="true" />
              <p className="text-sm text-[var(--color-success-text)]">
                <span className="font-semibold">Proposal mutually accepted.</span> This version is now immutable and incorporated into the formal Service Agreement.
              </p>
            </div>
            {onNavigateToContract && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToContract}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Proceed to Agreement
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scope Summary & Detailed Deliverables */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="typo-section-heading text-[var(--color-text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
            <span>Scope Summary</span>
          </h2>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed mt-3 bg-[var(--color-surface-secondary)] p-4 rounded-[var(--radius-button)] whitespace-pre-wrap break-words">
            {proposal.scopeSummary}
          </p>
        </div>

        {/* Deliverables Breakdown */}
        <div className="space-y-4 pt-2">
          <h3 className="typo-card-title text-[var(--color-text-primary)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
            <span>Schedule of Deliverables</span>
          </h3>

          <div className="space-y-4">
            {proposal.deliverables.map((del, idx) => (
              <div
                key={del.id || idx}
                className="rounded-[var(--radius-button)] border border-[var(--color-border)] p-5 bg-[var(--color-surface)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] text-xs font-semibold tabular-nums flex items-center justify-center shrink-0">
                      {del.phase}
                    </span>
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {del.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] tabular-nums">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Target delivery: Day {del.estimatedDueDays}</span>
                  </div>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                  {del.description}
                </p>

                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block mb-2">
                    Acceptance Criteria
                  </span>
                  <ul className="space-y-1.5">
                    {del.acceptanceCriteria.map((crit, cIdx) => (
                      <li
                        key={cIdx}
                        className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2"
                      >
                        <Check
                          className="w-3.5 h-3.5 text-[var(--color-success)] mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones & Staged Payment Commercial Terms */}
        <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
          <h3 className="typo-card-title text-[var(--color-text-primary)]">
            Two-Stage Milestone Payment Schedule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposal.milestones.map((ms) => {
              const msAmountFormatted = `${(ms.amountMinor / 100).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })} ${proposal.commercialTerms.currency}`;

              return (
                <div
                  key={ms.id}
                  className="rounded-[var(--radius-button)] p-4 bg-[var(--color-surface-secondary)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 tabular-nums">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Phase {ms.phase} ({ms.percentage}%)
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      {msAmountFormatted}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {ms.title}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {ms.description}
                  </p>
                  <div className="pt-2 text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-border)] flex flex-wrap justify-between gap-2 tabular-nums">
                    <span>Revisions included: {ms.revisionsAllowed}</span>
                    <span>
                      {ms.phase === 1 ? 'Due prior to activation' : 'Due upon final sign-off'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exclusions, Assumptions & Client Responsibilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--color-border)]">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              Exclusions (Out of Scope)
            </h3>
            <ul className="space-y-1.5">
              {proposal.exclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-[var(--color-error)] font-bold" aria-hidden="true">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              Working Assumptions
            </h3>
            <ul className="space-y-1.5">
              {proposal.assumptions.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-[var(--color-text-muted)] font-bold" aria-hidden="true">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              Client Responsibilities
            </h3>
            <ul className="space-y-1.5">
              {proposal.clientResponsibilities.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-[var(--color-text-muted)] font-bold" aria-hidden="true">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Revision Policy & Inspection */}
        <Alert variant="info" title="Inspection & Revision Standard">
          <p className="leading-relaxed">{proposal.commercialTerms.revisionPolicy}</p>
          <p className="mt-1 opacity-90 leading-relaxed">
            Inspection Window: Client receives five (5) business days following deliverable submission to review against the agreed acceptance criteria.
          </p>
        </Alert>
      </div>

      {/* Change Requests Section (if any exist) */}
      {proposal.changeRequests && proposal.changeRequests.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 space-y-4">
          <h2 className="typo-card-title text-[var(--color-text-primary)] flex items-center gap-2 tabular-nums">
            <RefreshCw className="w-4 h-4 text-[var(--color-warning)]" aria-hidden="true" />
            <span>Adjustment Requests History ({proposal.changeRequests.length})</span>
          </h2>

          <div className="space-y-3">
            {proposal.changeRequests.map((cr) => (
              <div
                key={cr.id}
                className="p-4 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {cr.requestedByName}
                    </span>
                    <Badge variant="neutral" size="sm" className="capitalize">
                      {cr.requestedByRole}
                    </Badge>
                    <Badge variant="warning" size="sm" className="capitalize">
                      {cr.category}
                    </Badge>
                  </div>
                  <span className="text-[var(--color-text-secondary)] tabular-nums">
                    {new Date(cr.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[var(--color-text-secondary)] leading-relaxed break-words">
                  {cr.message}
                </p>
              </div>
            ))}
          </div>

          {proposal.status === 'changes_requested' &&
            (isProfessional || isAdmin) &&
            onPublishRevisedProposal && (
              <div className="mt-4 p-4 rounded-[var(--radius-button)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-warning-text)] tabular-nums">
                    Revisions Requested on Proposal v{proposal.version}
                  </h3>
                  <p className="text-xs text-[var(--color-warning-text)] opacity-90 mt-0.5 tabular-nums">
                    Review the feedback above and publish Proposal v{proposal.version + 1} with updated scope, timeline, or commercial terms.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setRevScope(proposal.scopeSummary);
                    setRevAmount((proposal.commercialTerms.totalAmountMinor / 100).toString());
                    setRevDuration(proposal.commercialTerms.estimatedDurationDays.toString());
                    setRevisionError('');
                    setShowRevisionModal(true);
                  }}
                >
                  Prepare Proposal v{proposal.version + 1}
                </Button>
              </div>
            )}

          {proposal.status === 'changes_requested' && isClient && (
            <Alert variant="neutral" title="Revision in Progress">
              Your adjustment request has been recorded. The specialist is preparing Proposal v
              {proposal.version + 1}.
            </Alert>
          )}
        </div>
      )}

      {/* Acceptance Execution Form (if party has not accepted yet) */}
      {canAccept && !bothAccepted && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border-strong)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-5">
          <div className="border-b border-[var(--color-border)] pb-4">
            <h2 className="typo-section-heading text-[var(--color-text-primary)]">
              Confirm Formal Acceptance as{' '}
              <span className="capitalize">
                {isClient ? 'Client' : isProfessional ? 'Specialist' : 'Admin'}
              </span>
            </h2>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed tabular-nums">
              By confirming acceptance, you agree to the deliverables, acceptance criteria, and two-stage payment terms set out in Proposal v{proposal.version}.
            </p>
          </div>

          {acceptError && (
            <Alert variant="error" onDismiss={() => setAcceptError('')}>
              {acceptError}
            </Alert>
          )}

          <div className="space-y-4">
            <Checkbox
              id="proposal-accept-checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              label={`I have reviewed Proposal v${proposal.version} and agree to the scope, acceptance criteria, and two-stage milestone schedule (${proposal.commercialTerms.phase1Percentage ?? 50}% / ${proposal.commercialTerms.phase2Percentage ?? 50}%).`}
            />

            <div className="max-w-md">
              <Input
                id="proposal-accept-name"
                label="Typed Full Legal Name"
                required
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="e.g. Jane Doe"
                helperText="Recorded with timestamp in the proposal acceptance log."
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleAccept}
                isLoading={isAccepting}
                disabled={isAccepting || !agreeTerms || !typedName.trim()}
              >
                {isAccepting ? 'Recording Acceptance…' : `Accept Proposal v${proposal.version}`}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setChangeError('');
                  setShowChangeModal(true);
                }}
              >
                Request Adjustments Instead
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Modal */}
      <Modal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        title="Request Adjustments to Proposal"
        description={`Specify the areas of Proposal v${proposal.version} you would like adjusted prior to acceptance.`}
      >
        <form onSubmit={handleChangeSubmit} className="space-y-4 text-left">
          <Select
            id="proposal-change-category"
            label="Adjustment Category"
            value={changeCategory}
            onChange={(e) => setChangeCategory(e.target.value as ChangeRequestCategory)}
            options={[
              { value: 'scope', label: 'Scope & Deliverables' },
              { value: 'pricing', label: 'Commercial Terms & Pricing' },
              { value: 'timeline', label: 'Timeline & Duration' },
              { value: 'milestones', label: 'Milestone Criteria' },
              { value: 'revisions', label: 'Revision Limits' },
              { value: 'other', label: 'Other Terms' },
            ]}
          />

          <Textarea
            id="proposal-change-message"
            label="Requested Adjustments"
            required
            rows={4}
            value={changeMessage}
            onChange={(e) => setChangeMessage(e.target.value)}
            placeholder="Provide clear, actionable details of the adjustment you are requesting..."
          />

          <Input
            id="proposal-change-suggestion"
            label="Specific Alternative Suggestion (Optional)"
            value={suggestedValue}
            onChange={(e) => setSuggestedValue(e.target.value)}
            placeholder="e.g. Include tablet QA verification in Phase 2"
          />

          {changeError && <Alert variant="error">{changeError}</Alert>}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <Button type="button" variant="outline" onClick={() => setShowChangeModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingChange}
              disabled={isSubmittingChange || !changeMessage.trim()}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revision Modal for Proposal v2+ */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title={`Publish Revised Proposal v${proposal.version + 1}`}
        description={`Proposal v${proposal.version} remains immutable and preserved in version history.`}
      >
        <form onSubmit={handleRevisionSubmit} className="space-y-4 text-left">
          <Textarea
            id="proposal-rev-scope"
            label="Revised Scope Summary"
            required
            rows={3}
            value={revScope}
            onChange={(e) => setRevScope(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="proposal-rev-amount"
              label={`Total Fee (${proposal.commercialTerms.currency})`}
              required
              type="number"
              step="0.01"
              min="1"
              value={revAmount}
              onChange={(e) => setRevAmount(e.target.value)}
              className="tabular-nums"
            />
            <Input
              id="proposal-rev-duration"
              label="Estimated Duration (Days)"
              required
              type="number"
              min="1"
              value={revDuration}
              onChange={(e) => setRevDuration(e.target.value)}
              className="tabular-nums"
            />
          </div>

          <Input
            id="proposal-rev-notes"
            label="Summary of Changes (Optional)"
            value={revNotes}
            onChange={(e) => setRevNotes(e.target.value)}
            placeholder="e.g. Adjusted timeline and deliverables to incorporate dedicated QA"
          />

          {revisionError && <Alert variant="error">{revisionError}</Alert>}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <Button type="button" variant="outline" onClick={() => setShowRevisionModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPublishingRevision}>
              Publish Proposal v{proposal.version + 1}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
