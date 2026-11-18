import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Check,
  X,
  AlertCircle,
  Sparkles,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (candidateToSelect && !selecting) {
        setCandidateToSelect(null);
      } else if (inspectCandidate) {
        setInspectCandidate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candidateToSelect, inspectCandidate, selecting]);

  const handleConfirmSelection = async () => {
    if (!project || !candidateToSelect || !currentUser) return;
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
      setSuccessMsg(`Selection confirmed! You have selected ${candidateToSelect.professional.displayName}.`);

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

  if (loading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-[var(--color-text-secondary)] font-sans">
            Curating your personalized professional presentation...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (userProfile?.role === 'professional') {
    return (
      <DashboardLayout role="professional">
        <EmptyState
          title="Access Denied"
          description="Curated match comparison is only accessible to clients."
          action={{
            label: 'Go to Dashboard',
            onClick: () => navigate('/professional/dashboard'),
          }}
        />
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="client">
        <EmptyState
          title="Project not found"
          description="The requested project brief could not be located."
          action={{
            label: 'Back to Projects',
            onClick: () => navigate('/client/projects'),
          }}
        />
      </DashboardLayout>
    );
  }

  // Security authorization guard: only owner or admin can view matches
  if (currentUser && project.clientId !== currentUser.uid && userProfile?.role !== 'admin') {
    return (
      <DashboardLayout role="client">
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

  // If shortlist is not yet published by admin
  if (!shortlist || shortlist.candidates.length === 0) {
    return (
      <DashboardLayout role="client">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            to={`/client/projects/${project.id}`}
            className="inline-flex items-center text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-[var(--radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Project Brief
          </Link>

          <Card className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-text-primary)] mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="typo-section-heading text-[var(--color-text-primary)]">
              We are currently vetting and curating your matches
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto font-sans leading-relaxed">
              Our curation team is currently vetting professional responses, checking real-time capacity, and verifying customized quotes for "<strong className="text-[var(--color-text-primary)]">{project.title}</strong>".
            </p>
            <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-card)] max-w-md mx-auto text-xs text-[var(--color-text-secondary)] text-left space-y-1.5">
              <span className="font-semibold text-[var(--color-text-primary)] block">The Alongby Difference</span>
              <p className="leading-relaxed">
                You won't receive a generic public marketplace directory with hundreds of cold pitches. Instead, you'll receive a tailored, side-by-side comparison of 2–3 verified specialists with guaranteed availability and fixed commercial terms.
              </p>
            </div>
            <div className="pt-2">
              <Link to={`/client/projects/${project.id}`}>
                <Button variant="outline" size="sm">
                  View Project Status
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

  return (
    <DashboardLayout role="client">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              to={`/client/projects/${project.id}`}
              className="inline-flex items-center text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-2 rounded-[var(--radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Project Brief
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="typo-page-title text-[var(--color-text-primary)]">
                Curated Professional Matches
              </h1>
              {isSelectionMade ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Professional Selected
                </Badge>
              ) : (
                <Badge variant="outline" size="md" className="tabular-nums">
                  {shortlist.candidates.length} Vetted Specialists
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-sans mt-1.5 leading-relaxed">
              Review and compare quotes from verified specialists hand-selected for "<strong className="font-semibold text-[var(--color-text-primary)]">{project.title}</strong>".
            </p>
          </div>

          <Link to={`/client/projects/${project.id}`} className="shrink-0 w-fit">
            <Button variant="outline" size="sm">
              Project Overview
            </Button>
          </Link>
        </div>

        {/* Notifications / Alerts */}
        {successMsg && (
          <div
            role="status"
            className="p-4 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-[var(--radius-card)] text-sm text-[var(--color-success-text)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-xs font-medium underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-[var(--radius-card)] text-sm text-[var(--color-error-text)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs font-medium underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Selection Banner if Selection Made */}
        {isSelectionMade && (
          <Card className="p-6 border-[var(--color-success-border)] bg-[var(--color-success-bg)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-[var(--color-success-text)]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                    Professional Selection Confirmed
                  </h2>
                </div>
                <p className="text-[13px] text-[var(--color-success-text)] font-sans max-w-2xl leading-relaxed">
                  You selected{' '}
                  <strong className="font-semibold text-[var(--color-text-primary)]">
                    {selection?.selectionSnapshot?.professionalName || 'the specialist'}
                  </strong>{' '}
                  for a total commercial proposal of{' '}
                  <strong className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {selection?.selectionSnapshot
                      ? `${(selection.selectionSnapshot.amountMinor / 100).toLocaleString()} ${selection.selectionSnapshot.currency}`
                      : 'the submitted quote'}
                  </strong>
                  . Our team is now generating your formal project agreement and setting up milestone staged payment protection.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/client/projects/${project.id}/proposal`}>
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
                  {/* Integrated Status Row (no floating pill ribbons) */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
                      Option {idx + 1} of {shortlist.candidates.length}
                    </span>

                    {isSelected ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3" />
                        Selected Partner
                      </Badge>
                    ) : isRec ? (
                      <Badge variant="warning" size="sm">
                        <Star className="w-3 h-3 fill-current" />
                        Alongby Recommended
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        <ShieldCheck className="w-3 h-3 text-[var(--color-success)]" />
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
                        <MapPin className="w-3 h-3 shrink-0" />
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

                  {/* Why We Matched You (Clean muted block without nested border) */}
                  <div className="p-3.5 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)] text-[13px] space-y-1.5">
                    <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
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

                  {/* Commercial Quote Summary (Flat editorial section separated by hairline) */}
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.06em]">
                        Commercial Quote
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                          {(cand.quote.amountMinor / 100).toLocaleString()} {cand.quote.currency}
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
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
                        <span>
                          Starts:{' '}
                          <strong className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                            {cand.quote.proposedStartDate || 'On confirmation'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
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
                          <div key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)] font-sans">
                            <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0 mt-0.5" />
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
                            <span className="text-[var(--color-text-muted)]" aria-hidden="true">·</span>
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
                    View Full Proposal & Portfolio
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
                      <Check className="w-4 h-4 shrink-0" />
                      Confirmed Selection
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detailed Inspection Modal */}
        {inspectCandidate && (
          <div className="fixed inset-0 bg-[#171717]/45 flex items-center justify-center p-4 z-50">
            <div
              className="fixed inset-0"
              onClick={() => setInspectCandidate(null)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 max-w-3xl w-full bg-[var(--color-surface)] rounded-[var(--radius-modal)] border border-[var(--color-border)] shadow-[var(--shadow-overlay)] max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 p-6 border-b border-[var(--color-border)]">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center font-sans font-semibold text-lg shrink-0">
                    {inspectCandidate.professional.displayName?.charAt(0) || 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="typo-section-heading text-[var(--color-text-primary)] break-words">
                        {inspectCandidate.professional.displayName}
                      </h2>
                      <Badge variant="outline" size="sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" />
                        Verified Specialist
                      </Badge>
                      {inspectCandidate.isRecommended && (
                        <Badge variant="warning" size="sm">
                          <Star className="w-3 h-3 fill-current" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] font-sans mt-0.5">
                      {inspectCandidate.professional.professionalTitle} · {inspectCandidate.professional.country} ({inspectCandidate.professional.timezone})
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] tabular-nums font-sans mt-1 flex-wrap">
                      <span>{inspectCandidate.professional.yearsOfExperience}+ Years Experience</span>
                      {inspectCandidate.professional.languages && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Languages: {inspectCandidate.professional.languages.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectCandidate(null)}
                  aria-label="Close inspection dialog"
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Professional Bio */}
                {inspectCandidate.professional.shortBio && (
                  <div className="space-y-1.5 text-sm text-[var(--color-text-secondary)] font-sans">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                      About Specialist
                    </span>
                    <p className="leading-relaxed">{inspectCandidate.professional.shortBio}</p>
                  </div>
                )}

                {/* Skills & Core Disciplines */}
                {inspectCandidate.professional.skills && inspectCandidate.professional.skills.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block font-sans">
                      Core Skills & Tools
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectCandidate.professional.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Why We Matched You Narrative */}
                <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-card)] text-[13px] space-y-2">
                  <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    Curator Match Evaluation
                  </span>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed font-sans">
                    {inspectCandidate.clientSafeMatchReason}
                  </p>
                  {inspectCandidate.recommendationRationale && (
                    <p className="text-[var(--color-warning-text)] pt-1 font-medium">
                      Curator Note: {inspectCandidate.recommendationRationale}
                    </p>
                  )}
                </div>

                {/* Commercial Terms & Quote Details */}
                <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                    <div>
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        Commercial Proposal & Schedule
                      </h3>
                      <span className="text-xs text-[var(--color-text-secondary)] font-sans">
                        Fixed-scope proposal prepared for your project
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                        {(inspectCandidate.quote.amountMinor / 100).toLocaleString()}{' '}
                        {inspectCandidate.quote.currency}
                      </span>
                      {inspectCandidate.quote.quoteType === 'alternative' && (
                        <span className="text-xs text-[var(--color-warning-text)] font-medium block">
                          Custom Alternative Scope
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                    <div className="p-3 bg-[var(--color-surface-secondary)] rounded-[var(--radius-button)]">
                      <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                        Kickoff Readiness
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
                  <div className="space-y-1.5 text-[13px] text-[var(--color-text-secondary)] font-sans">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                      Scope Summary
                    </span>
                    <p className="leading-relaxed bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)] text-[var(--color-text-primary)]">
                      {inspectCandidate.quote.scopeSummary}
                    </p>
                  </div>

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans pt-1">
                    {inspectCandidate.quote.includedItems && inspectCandidate.quote.includedItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-[var(--color-success-text)] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                          Explicitly Included
                        </span>
                        <ul className="space-y-1.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)]">
                          {inspectCandidate.quote.includedItems.map((inc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[var(--color-success)] font-semibold">✓</span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {inspectCandidate.quote.excludedItems && inspectCandidate.quote.excludedItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                          Explicitly Excluded
                        </span>
                        <ul className="space-y-1.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] p-3.5 rounded-[var(--radius-button)]">
                          {inspectCandidate.quote.excludedItems.map((exc, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[var(--color-text-muted)] font-semibold">✕</span>
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
                                View Live Work <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 p-5 sm:px-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectCandidate(null)}
                >
                  Close Inspection
                </Button>

                {!isSelectionMade && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setCandidateToSelect(inspectCandidate);
                      setInspectCandidate(null);
                    }}
                  >
                    Select {inspectCandidate.professional.displayName}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selection Confirmation Modal */}
        {candidateToSelect && (
          <div className="fixed inset-0 bg-[#171717]/45 flex items-center justify-center p-4 z-50">
            <div
              className="fixed inset-0"
              onClick={() => {
                if (!selecting) setCandidateToSelect(null);
              }}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 max-w-lg w-full bg-[var(--color-surface)] rounded-[var(--radius-modal)] border border-[var(--color-border)] shadow-[var(--shadow-overlay)] p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] flex items-center justify-center text-[var(--color-success-text)] shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="typo-section-heading text-[var(--color-text-primary)]">
                    Confirm Professional Selection
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] font-sans truncate">
                    Finalize your chosen partner for {project.title}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-[13px] text-[var(--color-text-secondary)] font-sans leading-relaxed">
                <p>
                  You are selecting{' '}
                  <strong className="font-semibold text-[var(--color-text-primary)]">
                    {candidateToSelect.professional.displayName}
                  </strong>{' '}
                  as your verified specialist partner.
                </p>

                <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-card)] space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[var(--color-text-secondary)] font-medium">
                      Fixed Proposal Amount
                    </span>
                    <span className="font-sans text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                      {(candidateToSelect.quote.amountMinor / 100).toLocaleString()}{' '}
                      {candidateToSelect.quote.currency}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--color-text-secondary)]">Estimated Turnaround</span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {candidateToSelect.quote.estimatedDurationDays} days
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--color-text-secondary)]">Commencement</span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {candidateToSelect.quote.proposedStartDate || 'Upon agreement signing'}
                    </span>
                  </div>

                  {candidateToSelect.quote.scopeSummary && (
                    <div className="pt-2.5 border-t border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)] font-medium block mb-1">
                        Scope of Work
                      </span>
                      <p className="text-[var(--color-text-primary)] leading-relaxed max-h-24 overflow-y-auto">
                        {candidateToSelect.quote.scopeSummary}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-[var(--color-success-bg)] rounded-[var(--radius-card)] border border-[var(--color-success-border)] text-[var(--color-success-text)] space-y-1.5 text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    What happens next
                  </span>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The specialist is immediately notified of your selection.</li>
                    <li>The Alongby team prepares your formal project agreement with milestone protection.</li>
                    <li>No payment is charged right now. Staged deposits apply only upon contract signing.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
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
                  size="md"
                  loading={selecting}
                  onClick={handleConfirmSelection}
                >
                  Confirm Selection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

