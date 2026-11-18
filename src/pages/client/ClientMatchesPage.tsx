import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { projectService } from '../../services/projectService';
import { shortlistService } from '../../services/shortlistService';
import { proposalService } from '../../services/proposalService';
import {
  Project,
  PublishedShortlist,
  ShortlistCandidateSnapshot,
  ProfessionalSelection,
} from '../../types';
import {
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Check,
  X,
  Compass,
  ExternalLink,
  ArrowRight,
  MapPin,
} from 'lucide-react';

export const ClientMatchesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [shortlist, setShortlist] = useState<PublishedShortlist | null>(null);
  const [selection, setSelection] = useState<ProfessionalSelection | null>(null);
  const [loading, setLoading] = useState(true);

  // Interaction state
  const [inspectCandidate, setInspectCandidate] = useState<ShortlistCandidateSnapshot | null>(null);
  const [candidateToSelect, setCandidateToSelect] = useState<ShortlistCandidateSnapshot | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const [projData, pubShortlist, selRecord] = await Promise.all([
        projectService.getProject(projectId),
        shortlistService.getPublishedShortlist(projectId),
        shortlistService.getSelection(projectId),
      ]);

      setProject(projData);
      setShortlist(pubShortlist);
      setSelection(selRecord);
    } catch (err: any) {
      console.error('Failed to load client matches:', err);
      setErrorMsg(err?.message || 'Failed to load your curated matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleConfirmSelection = async () => {
    if (!project || !candidateToSelect || !currentUser || selecting) return;
    try {
      setSelecting(true);
      setErrorMsg(null);

      const result = await shortlistService.selectProfessional(
        project.id,
        candidateToSelect.professionalId,
        currentUser.uid,
        currentUser.displayName || project.clientName
      );

      setSelection(result);
      setCandidateToSelect(null);
      setInspectCandidate(null);
      setSuccessMsg(
        `Selection confirmed. You have selected ${candidateToSelect.professional.displayName}.`
      );

      // Automatically initialize Proposal v1 in background
      try {
        await proposalService.initializeProposalFromSelection(project.id, currentUser.uid);
      } catch (propErr) {
        console.warn('Could not auto-initialize proposal:', propErr);
      }

      loadData();
    } catch (err: any) {
      console.error('Failed to select professional:', err);
      setErrorMsg(err?.message || 'Failed to confirm selection. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  const isAdminViewer = userProfile?.role === 'admin';
  const layoutRole = isAdminViewer ? 'admin' : 'client';

  if (loading) {
    return (
      <DashboardLayout role={layoutRole}>
        <div className="flex flex-col items-center justify-center min-h-[360px]">
          <LoadingSpinner size="lg" label="Loading your curated professional shortlist…" />
        </div>
      </DashboardLayout>
    );
  }

  if (userProfile?.role === 'professional') {
    return (
      <DashboardLayout role="professional" title="Access Restricted">
        <EmptyState
          title="Access Denied"
          description="Curated shortlist comparison is accessible only to the project client."
          action={{
            label: 'Go to Workspace',
            onClick: () => navigate('/professional'),
          }}
        />
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role={layoutRole} title="Project Not Found">
        <EmptyState
          title="Project not found"
          description="The requested project brief could not be located."
          action={{
            label: 'Back to Projects',
            onClick: () => navigate(isAdminViewer ? '/admin' : '/client/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  // Security authorization guard: only owner or admin can view matches
  if (currentUser && project.clientId !== currentUser.uid && !isAdminViewer) {
    return (
      <DashboardLayout role="client" title="Access Restricted">
        <EmptyState
          title="Access Denied"
          description="You do not have permission to view curated matches for this project."
          action={{
            label: 'Back to My Projects',
            onClick: () => navigate('/client/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  const breadcrumbs = isAdminViewer
    ? [
        { label: 'Admin Console', to: '/admin' },
        { label: project.title || 'Project', to: `/admin/projects/${project.id}/shortlist` },
        { label: 'Client Shortlist Preview' },
      ]
    : [
        { label: 'Workspace', to: '/client' },
        { label: 'Projects', to: '/client/projects' },
        { label: project.title || 'Project', to: `/client/projects/${project.id}` },
        { label: 'Curated Matches' },
      ];

  // If shortlist is not yet published by admin
  if (!shortlist || shortlist.candidates.length === 0) {
    return (
      <DashboardLayout
        role={layoutRole}
        breadcrumbs={breadcrumbs}
        title="Curated Professional Matches"
        subtitle={`Shortlist curation status for "${project.title}"`}
        action={
          <Link to={`/client/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              Project Overview
            </Button>
          </Link>
        }
      >
        <div className="max-w-3xl space-y-6">
          {errorMsg && (
            <Alert variant="error" onDismiss={() => setErrorMsg(null)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{errorMsg}</span>
                <Button variant="outline" size="sm" onClick={loadData}>
                  Retry
                </Button>
              </div>
            </Alert>
          )}

          <Card className="p-8 text-center space-y-4">
            <div className="w-11 h-11 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] mx-auto">
              <Compass className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="typo-section-heading text-[var(--color-text-primary)]">
              We are currently vetting and curating your matches
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto font-sans leading-relaxed">
              Our curation team is reviewing specialist responses, verifying capacity, and preparing structured commercial quotes for{' '}
              <strong className="font-semibold text-[var(--color-text-primary)]">
                {project.title}
              </strong>
              .
            </p>
            <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-card)] max-w-md mx-auto text-xs text-[var(--color-text-secondary)] text-left space-y-1.5">
              <span className="font-semibold text-[var(--color-text-primary)] block">
                Curated Side-by-Side Comparison
              </span>
              <p className="leading-relaxed">
                Rather than an open marketplace directory of cold pitches, you will receive a focused comparison of 2–3 verified specialists with clear deliverables, timelines, and commercial quotes.
              </p>
            </div>
            <div className="pt-2">
              <Link to={`/client/projects/${project.id}`}>
                <Button variant="outline" size="sm">
                  Return to Project Overview
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isSelectionMade = Boolean(selection || shortlist.selectedProfessionalId);
  const selectedProfId = selection?.professionalId || shortlist.selectedProfessionalId;
  const proposalRoute = isAdminViewer
    ? `/admin/projects/${project.id}/proposal`
    : `/client/projects/${project.id}/proposal`;

  return (
    <DashboardLayout
      role={layoutRole}
      breadcrumbs={breadcrumbs}
      title="Curated Professional Matches"
      subtitle={`Compare ${shortlist.candidates.length} verified specialists and tailored quotes prepared for "${project.title}".`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {isSelectionMade ? (
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Professional Selected
            </Badge>
          ) : (
            <Badge variant="outline" size="md" className="tabular-nums">
              {shortlist.candidates.length} Vetted Specialists
            </Badge>
          )}
          <Link to={`/client/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              Project Overview
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 pb-12">
        {/* Notifications / Alerts */}
        {successMsg && (
          <Alert variant="success" onDismiss={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {errorMsg && (
          <Alert variant="error" onDismiss={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* Selection Banner if Selection Made */}
        {isSelectionMade && (
          <Card className="p-6 border-[var(--color-success-border)] bg-[var(--color-success-bg)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-[var(--color-success-text)]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                    Professional Selection Confirmed
                  </h2>
                </div>
                <p className="text-[13px] text-[var(--color-success-text)] font-sans max-w-2xl leading-relaxed">
                  You selected{' '}
                  <strong className="font-semibold text-[var(--color-text-primary)]">
                    {selection?.selectionSnapshot?.professionalName || 'your chosen specialist'}
                  </strong>{' '}
                  at a quoted commercial fee of{' '}
                  <strong className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {selection?.selectionSnapshot
                      ? `€${(selection.selectionSnapshot.amountMinor / 100).toLocaleString()} ${selection.selectionSnapshot.currency}`
                      : 'the submitted quote'}
                  </strong>
                  . Proceed to review and align on the itemized commercial proposal and two-stage milestone schedule.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to={proposalRoute}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review Commercial Proposal
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Curated 2–3 Candidates Comparison Deck */}
        <div
          className={`grid grid-cols-1 ${
            shortlist.candidates.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
          } gap-6 items-stretch`}
        >
          {shortlist.candidates.map((cand, idx) => {
            const isSelected = selectedProfId === cand.professionalId;
            const isRec = cand.isRecommended;

            return (
              <Card
                key={cand.professionalId}
                className={`p-6 flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-[var(--color-success)] ring-1 ring-[var(--color-success)] bg-[var(--color-surface)]'
                    : isRec
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div className="space-y-5">
                  {/* Integrated Status Row */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
                      Option {idx + 1} of {shortlist.candidates.length}
                    </span>

                    {isSelected ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        Selected Partner
                      </Badge>
                    ) : isRec ? (
                      <Badge variant="warning" size="sm">
                        <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                        Alongby Recommended
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        <ShieldCheck className="w-3 h-3 text-[var(--color-success)]" aria-hidden="true" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Professional Header */}
                  <div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center font-sans font-semibold text-base shrink-0">
                        {cand.professional.displayName?.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="typo-card-title text-[var(--color-text-primary)] break-words">
                          {cand.professional.displayName}
                        </h3>
                        <p className="text-[13px] text-[var(--color-text-secondary)] font-medium font-sans mt-0.5 truncate">
                          {cand.professional.professionalTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] tabular-nums font-sans mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                        {cand.professional.country}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{cand.professional.yearsOfExperience}+ yrs exp</span>
                      {cand.professional.completedProjectCount ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{cand.professional.completedProjectCount} projects</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Why We Matched You */}
                  <div className="p-3.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)] text-[13px] space-y-1.5">
                    <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 text-xs">
                      <Compass className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                      Why we matched you
                    </span>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed font-sans">
                      {cand.clientSafeMatchReason}
                    </p>
                  </div>

                  {/* Recommendation Rationale if provided */}
                  {isRec && cand.recommendationRationale && (
                    <div className="p-3 bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-[var(--radius-button)] text-xs text-[var(--color-warning-text)]">
                      <span className="font-semibold block mb-0.5">Curator Note</span>
                      <p className="leading-relaxed">{cand.recommendationRationale}</p>
                    </div>
                  )}

                  {/* Commercial Quote Summary */}
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        Commercial Quote
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                          €{(cand.quote.amountMinor / 100).toLocaleString()} {cand.quote.currency}
                        </span>
                        {cand.quote.quoteType === 'alternative' && (
                          <span className="text-[11px] text-[var(--color-warning-text)] font-medium block">
                            Custom Alternative Scope
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)] font-sans">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                        <span>
                          Starts:{' '}
                          <strong className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                            {cand.quote.proposedStartDate || 'On confirmation'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                        <span>
                          Timeline:{' '}
                          <strong className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                            {cand.quote.estimatedDurationDays} days
                          </strong>
                        </span>
                      </div>
                    </div>

                    {cand.keyMatchHighlights && cand.keyMatchHighlights.length > 0 && (
                      <div className="pt-1 space-y-1.5">
                        {cand.keyMatchHighlights.map((hl, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)] font-sans"
                          >
                            <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Included Deliverables preview */}
                  {cand.quote.includedItems && cand.quote.includedItems.length > 0 && (
                    <div className="pt-4 border-t border-[var(--color-border)] space-y-1.5 text-xs font-sans">
                      <span className="font-semibold text-[var(--color-text-primary)] block">
                        Scope Inclusions
                      </span>
                      <ul className="space-y-1 text-[var(--color-text-secondary)]">
                        {cand.quote.includedItems.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[var(--color-text-muted)]" aria-hidden="true">
                              ·
                            </span>
                            <span className="line-clamp-1">{item}</span>
                          </li>
                        ))}
                        {cand.quote.includedItems.length > 3 && (
                          <li className="text-xs text-[var(--color-text-secondary)] font-medium tabular-nums pl-3">
                            + {cand.quote.includedItems.length - 3} more deliverables
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-5 mt-6 border-t border-[var(--color-border)] space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setInspectCandidate(cand)}
                  >
                    View Full Proposal &amp; Portfolio
                  </Button>

                  {!isSelectionMade ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => setCandidateToSelect(cand)}
                    >
                      Select {cand.professional.displayName.split(' ')[0]}
                    </Button>
                  ) : isSelected ? (
                    <div className="p-2.5 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-text)] rounded-[var(--radius-button)] text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                      Confirmed Selection
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] rounded-[var(--radius-button)] text-center text-xs font-medium">
                      Not Selected
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detailed Inspection Modal (Standardized Stage B Modal) */}
        <Modal
          isOpen={Boolean(inspectCandidate)}
          onClose={() => setInspectCandidate(null)}
          maxWidth="2xl"
          title={
            inspectCandidate
              ? `${inspectCandidate.professional.displayName} — Proposal & Profile`
              : 'Specialist Proposal'
          }
          description={
            inspectCandidate
              ? `${inspectCandidate.professional.professionalTitle} · ${inspectCandidate.professional.country} (${inspectCandidate.professional.timezone})`
              : undefined
          }
          footer={
            inspectCandidate ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setInspectCandidate(null)}>
                  Close
                </Button>
                {!isSelectionMade && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const chosen = inspectCandidate;
                      setInspectCandidate(null);
                      setCandidateToSelect(chosen);
                    }}
                  >
                    Select {inspectCandidate.professional.displayName}
                  </Button>
                )}
              </>
            ) : undefined
          }
        >
          {inspectCandidate && (
            <div className="space-y-6">
              {/* Credentials & Experience Summary */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)] tabular-nums">
                <Badge variant="outline" size="sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" aria-hidden="true" />
                  Verified Specialist
                </Badge>
                {inspectCandidate.isRecommended && (
                  <Badge variant="warning" size="sm">
                    <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                    Alongby Recommended
                  </Badge>
                )}
                <span aria-hidden="true">·</span>
                <span>{inspectCandidate.professional.yearsOfExperience}+ Years Experience</span>
                {inspectCandidate.professional.languages &&
                  inspectCandidate.professional.languages.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Languages: {inspectCandidate.professional.languages.join(', ')}</span>
                    </>
                  )}
              </div>

              {/* Professional Bio */}
              {inspectCandidate.professional.shortBio && (
                <div className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                    About Specialist
                  </span>
                  <p className="leading-relaxed">{inspectCandidate.professional.shortBio}</p>
                </div>
              )}

              {/* Skills & Core Disciplines */}
              {inspectCandidate.professional.skills &&
                inspectCandidate.professional.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                      Core Skills &amp; Stack
                    </span>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {inspectCandidate.professional.skills.join(' · ')}
                    </p>
                  </div>
                )}

              {/* Why We Matched You Narrative */}
              <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-card)] text-[13px] space-y-2">
                <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 text-xs">
                  <Compass className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  Curator Match Rationale
                </span>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {inspectCandidate.clientSafeMatchReason}
                </p>
                {inspectCandidate.recommendationRationale && (
                  <p className="text-[var(--color-warning-text)] pt-1 text-xs font-medium">
                    Curator Note: {inspectCandidate.recommendationRationale}
                  </p>
                )}
              </div>

              {/* Commercial Terms & Quote Details */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                  <div>
                    <h4 className="typo-card-title text-[var(--color-text-primary)]">
                      Submitted Quote &amp; Delivery Terms
                    </h4>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      Prepared specifically for your project brief
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                      €{(inspectCandidate.quote.amountMinor / 100).toLocaleString()}{' '}
                      {inspectCandidate.quote.currency}
                    </span>
                    {inspectCandidate.quote.quoteType === 'alternative' && (
                      <span className="text-xs text-[var(--color-warning-text)] font-medium block">
                        Custom Alternative Scope
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)]">
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Proposed Start
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {inspectCandidate.quote.proposedStartDate || 'Upon agreement signing'}
                    </span>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)]">
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Estimated Duration
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {inspectCandidate.quote.estimatedDurationDays} calendar days
                    </span>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)]">
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Revision Rounds
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {inspectCandidate.quote.revisionsIncluded} rounds included
                    </span>
                  </div>
                </div>

                {/* Scope Summary */}
                <div className="space-y-1.5 text-[13px]">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                    Scope Summary
                  </span>
                  <p className="leading-relaxed bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)] text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
                    {inspectCandidate.quote.scopeSummary}
                  </p>
                </div>

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  {inspectCandidate.quote.includedItems &&
                    inspectCandidate.quote.includedItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-[var(--color-success-text)] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[var(--color-success)]" aria-hidden="true" />
                          Explicitly Included
                        </span>
                        <ul className="space-y-1.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)]">
                          {inspectCandidate.quote.includedItems.map((inc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[var(--color-success)] font-semibold" aria-hidden="true">
                                ✓
                              </span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {inspectCandidate.quote.excludedItems &&
                    inspectCandidate.quote.excludedItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                          Explicitly Excluded
                        </span>
                        <ul className="space-y-1.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)]">
                          {inspectCandidate.quote.excludedItems.map((exc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[var(--color-text-muted)] font-semibold" aria-hidden="true">
                                ✕
                              </span>
                              <span>{exc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Alternative Explanation if provided */}
                {inspectCandidate.quote.alternativeExplanation && (
                  <div className="p-3.5 bg-[var(--color-warning-bg)] rounded-[var(--radius-button)] border border-[var(--color-warning-border)] text-xs space-y-1">
                    <span className="font-semibold text-[var(--color-warning-text)] block">
                      Alternative Proposal Rationale
                    </span>
                    <p className="text-[var(--color-warning-text)] leading-relaxed">
                      {inspectCandidate.quote.alternativeExplanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Portfolio / Relevant Past Work Items */}
              {inspectCandidate.professional.portfolioItems &&
                inspectCandidate.professional.portfolioItems.length > 0 && (
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                    <h4 className="typo-card-title text-[var(--color-text-primary)]">
                      Featured Past Work
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {inspectCandidate.professional.portfolioItems.map((item, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)] space-y-1.5"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {item.title}
                            </span>
                            {item.year && (
                              <span className="text-[var(--color-text-secondary)] tabular-nums">
                                {item.year}
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                          {item.liveUrl && (
                            <a
                              href={item.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--color-text-primary)] hover:underline font-semibold inline-flex items-center gap-1 pt-0.5"
                            >
                              View Live Work <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </Modal>

        {/* Selection Confirmation Modal (Standardized Stage B Modal) */}
        <Modal
          isOpen={Boolean(candidateToSelect)}
          onClose={() => {
            if (!selecting) setCandidateToSelect(null);
          }}
          maxWidth="lg"
          title="Confirm Professional Selection"
          description={`Finalize your chosen specialist for "${project.title}"`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={selecting}
                onClick={() => setCandidateToSelect(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={selecting}
                onClick={handleConfirmSelection}
              >
                Confirm Selection
              </Button>
            </>
          }
        >
          {candidateToSelect && (
            <div className="space-y-4 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              <p>
                You are selecting{' '}
                <strong className="font-semibold text-[var(--color-text-primary)]">
                  {candidateToSelect.professional.displayName}
                </strong>{' '}
                as your specialist partner for this engagement.
              </p>

              <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-card)] space-y-2.5 text-xs">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[var(--color-text-secondary)] font-medium">
                    Quoted Amount
                  </span>
                  <span className="font-sans text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                    €{(candidateToSelect.quote.amountMinor / 100).toLocaleString()}{' '}
                    {candidateToSelect.quote.currency}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--color-text-secondary)]">Estimated Duration</span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {candidateToSelect.quote.estimatedDurationDays} calendar days
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--color-text-secondary)]">Proposed Start</span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {candidateToSelect.quote.proposedStartDate || 'Upon agreement signing'}
                  </span>
                </div>

                {candidateToSelect.quote.scopeSummary && (
                  <div className="pt-2.5 border-t border-[var(--color-border)]">
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-1">
                      Scope Summary
                    </span>
                    <p className="text-[var(--color-text-primary)] leading-relaxed max-h-24 overflow-y-auto break-words">
                      {candidateToSelect.quote.scopeSummary}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-[var(--color-info-bg)] rounded-[var(--radius-card)] border border-[var(--color-info-border)] text-[var(--color-info-text)] space-y-1.5 text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  What happens upon confirmation
                </span>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  <li>
                    This shortlist closes to other candidates (one specialist per shortlist).
                  </li>
                  <li>
                    {candidateToSelect.professional.displayName} is notified and Commercial Proposal v1 is prepared for mutual review.
                  </li>
                  <li>
                    No payment is charged now; the Phase 1 deposit stage applies only after proposal acceptance and service agreement signatures.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
