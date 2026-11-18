import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import { shortlistService } from '../../services/shortlistService';
import {
  CLIENT_LIFECYCLE_STAGES,
  formatActivityDisplay,
  formatProjectBudget,
  formatTimelineOption,
  getClientLifecycleStageIndex,
  getClientProjectStatusDisplay,
} from '../../utils/statusMapping';
import { Project, ProjectBriefSnapshot, ActivityEvent, PublishedShortlist } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Clock,
  Euro,
  Paperclip,
  Check,
  CheckCircle2,
  Layers,
  Lock,
  Download,
  AlertCircle,
  ArrowRight,
  Compass,
  FileText,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [snapshots, setSnapshots] = useState<ProjectBriefSnapshot[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [shortlist, setShortlist] = useState<PublishedShortlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId || !userProfile?.id) return;

    try {
      setLoading(true);
      setError(null);
      const p = await projectService.getProject(projectId);

      if (!p) {
        setError('Project not found.');
        return;
      }

      // Security check: only project owner or admin can view
      if (p.clientId !== userProfile.id && userProfile.role !== 'admin') {
        setError('You do not have authorization to view this project.');
        return;
      }

      setProject(p);

      // Fetch snapshots, activities, and published shortlist
      const [snaps, acts, pubShortlist] = await Promise.all([
        projectService.getBriefSnapshots(projectId),
        projectService.getActivityEvents(projectId),
        shortlistService.getPublishedShortlist(projectId).catch(() => null),
      ]);

      setSnapshots(snaps);
      setActivities(acts);
      setShortlist(pubShortlist);
    } catch (err) {
      console.error('Failed to load project details:', err);
      setError('Error loading project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId, userProfile?.id, userProfile?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <DashboardLayout title="Project Details">
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
            Loading project details…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="Project Details">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error-text)] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="typo-section-heading text-[var(--color-text-primary)]">
            {error || 'Project not found'}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            The project you are trying to access does not exist or you do not have permission to view it.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/client/projects')}>
              Return to My Projects
            </Button>
            {error === 'Error loading project details.' && (
              <Button variant="primary" onClick={loadData}>
                Retry
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const brief = project.brief;
  const service = taxonomyService.getServiceCategoryById(project.serviceId);
  const projectType = service?.projectTypes.find((pt) => pt.id === project.projectTypeId);
  const allFeatures = taxonomyService.getFeaturesForService(project.serviceId);
  const allAssets = taxonomyService.getExistingAssets();
  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const lookupRangeLabel = (id: string) => budgetRanges.find((r) => r.id === id)?.label;

  const isDraft = project.status === 'draft';
  const isExceptionState =
    project.status === 'cancelled' ||
    project.status === 'paused' ||
    project.status === 'disputed';
  const candidateCount = shortlist?.candidates?.length || 0;
  const statusDisplay = getClientProjectStatusDisplay(project.status, project.submittedAt);
  const activeStageIndex = getClientLifecycleStageIndex(project.status);

  const hasShortlistLink = Boolean(
    shortlist ||
      project.status === 'shortlist_ready' ||
      project.status === 'professional_selected'
  );
  const hasProposalLink = Boolean(
    project.currentProposalId ||
      project.selectedProfessionalId ||
      project.status === 'professional_selected' ||
      project.status === 'proposal_pending' ||
      project.status === 'proposal_accepted' ||
      project.status === 'contract_pending' ||
      project.status === 'awaiting_signatures' ||
      project.status === 'awaiting_deposit'
  );
  const hasContractLink = Boolean(
    project.currentContractId ||
      project.status === 'proposal_accepted' ||
      project.status === 'contract_pending' ||
      project.status === 'awaiting_signatures' ||
      project.status === 'awaiting_deposit' ||
      project.status === 'active_phase_1' ||
      project.status === 'phase_1_review' ||
      project.status === 'awaiting_final_payment' ||
      project.status === 'active_phase_2' ||
      project.status === 'final_review' ||
      project.status === 'completed'
  );

  void snapshots;

  return (
    <DashboardLayout
      breadcrumbs={
        userProfile?.role === 'admin'
          ? [
              { label: 'Platform Admin', to: '/admin' },
              { label: project.title || 'Project Brief' },
            ]
          : [
              { label: 'Client Workspace', to: '/client' },
              { label: 'My Projects', to: '/client/projects' },
              { label: project.title || 'Project Brief' },
            ]
      }
      title={project.title || (isDraft ? 'Untitled Project Brief' : 'Project Details')}
      subtitle={`Created on ${new Date(project.createdAt).toLocaleDateString()}${
        service ? ` · ${service.name}` : ''
      }`}
      action={
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(userProfile?.role === 'admin' ? '/admin' : '/client/projects')
            }
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            {userProfile?.role === 'admin' ? 'Admin Queue' : 'All Projects'}
          </Button>

          {isDraft && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/new?draftId=${project.id}`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Continue Brief
            </Button>
          )}

          {project.status === 'shortlist_ready' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/${project.id}/matches`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Your Matches
            </Button>
          )}

          {(project.status === 'professional_selected' ||
            project.status === 'proposal_pending') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/${project.id}/proposal`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Review Proposal
            </Button>
          )}

          {(project.status === 'proposal_accepted' ||
            project.status === 'contract_pending' ||
            project.status === 'awaiting_signatures') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/${project.id}/contract`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Review Agreement
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 lg:space-y-8">
        {/* Lifecycle Stage Tracker (Non-draft standard workflow states) */}
        {!isDraft && !isExceptionState && (
          <Card className="p-4 sm:p-5 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Project Lifecycle
              </span>
              <Badge variant={statusDisplay.badgeVariant}>{statusDisplay.badgeText}</Badge>
            </div>
            <ol
              aria-label="Project progress stages"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
            >
              {CLIENT_LIFECYCLE_STAGES.map((stage, idx) => {
                const isCompleted =
                  project.status === 'completed' ? true : idx < activeStageIndex;
                const isCurrent =
                  project.status !== 'completed' && idx === activeStageIndex;

                return (
                  <li
                    key={stage.id}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`px-3 py-2.5 rounded-[var(--radius-input)] border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)] font-semibold'
                        : isCompleted
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)] font-medium'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <Check
                          className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className={`tabular-nums text-[11px] shrink-0 ${
                            isCurrent
                              ? 'text-[var(--color-primary-text)]/80'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          0{idx + 1}.
                        </span>
                      )}
                      <span className="truncate">{stage.label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        {/* Primary Stage Callout Banner */}
        {(project.status === 'submitted' ||
          project.status === 'matching' ||
          project.status === 'budget_review' ||
          project.status === 'awaiting_professional_responses' ||
          project.status === 'shortlist_review') && (
          <Card className="p-6 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-info-text)]">
                  <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Matching in Progress</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  {statusDisplay.headline}
                </h2>
                <p className="text-[13px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                  {statusDisplay.description}
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-1.5">
                <div
                  className="px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs inline-flex items-center gap-1.5 border border-[var(--color-border)] w-fit"
                  title="Your submitted brief is locked while specialists evaluate your scope."
                >
                  <Lock className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                  <span className="font-medium">Brief locked</span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] max-w-[240px] text-left sm:text-right leading-snug">
                  Editing is paused so all invited specialists price the identical scope.
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action Banner: Curated Matches Ready */}
        {project.status === 'shortlist_ready' && (
          <Card className="p-6 bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-text)]/80">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Curated Matches Ready</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-primary-text)]">
                  Your curated professional shortlist is ready
                </h2>
                <p className="text-[13px] text-[var(--color-primary-text)]/85 max-w-2xl leading-relaxed">
                  {candidateCount > 0 ? (
                    <span className="text-[var(--color-primary-text)] font-semibold tabular-nums">
                      {candidateCount === 1
                        ? '1 verified specialist is ready to compare.'
                        : `${candidateCount} verified specialists are ready to compare.`}{' '}
                    </span>
                  ) : null}
                  Compare their commercial quotes, included deliverables, availability, and rationale side by side, then select your preferred partner.
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/matches`}>
                  <Button
                    variant="white"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    View Your Matches
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Confirmed State: Professional Selected */}
        {project.status === 'professional_selected' && (
          <Card className="p-6 bg-[var(--color-success-bg)] border-[var(--color-success-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-success-text)]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Professional Selected</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  Selection Confirmed
                </h2>
                <p className="text-[13px] text-[var(--color-success-text)] max-w-2xl leading-relaxed">
                  Proceed to review the itemized commercial proposal, deliverables, milestone payment schedule, and revision terms.
                </p>
              </div>

              <div className="shrink-0 flex items-center flex-wrap gap-2.5">
                <Link to={`/client/projects/${project.id}/matches`}>
                  <Button variant="outline" size="sm">
                    View Shortlist
                  </Button>
                </Link>
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Review Proposal
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action Banner: Commercial Proposal Pending */}
        {project.status === 'proposal_pending' && (
          <Card className="p-6 bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-text)]/80">
                  <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Commercial Proposal Ready</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-primary-text)]">
                  Commercial Proposal Ready for Review
                </h2>
                <p className="text-[13px] text-[var(--color-primary-text)]/85 max-w-2xl leading-relaxed">
                  Inspect deliverables, milestone payment stages, acceptance criteria, and revision allowances before mutual sign-off.
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button
                    variant="white"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review &amp; Accept Proposal
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action Banner: Service Agreement Pending Signatures */}
        {(project.status === 'proposal_accepted' ||
          project.status === 'contract_pending' ||
          project.status === 'awaiting_signatures') && (
          <Card className="p-6 bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-text)]/80">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Service Agreement Ready</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-primary-text)]">
                  Service Agreement Awaiting Signatures
                </h2>
                <p className="text-[13px] text-[var(--color-primary-text)]/85 max-w-2xl leading-relaxed">
                  The commercial proposal has been accepted. Review the complete agreement terms and record dual-party acceptance.
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/contract`}>
                  <Button
                    variant="white"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review &amp; Sign Agreement
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Confirmed State: Agreement Signed / Awaiting Deposit */}
        {project.status === 'awaiting_deposit' && (
          <Card className="p-6 bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-warning-text)]">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Agreement Signed · Awaiting Deposit Stage</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  Awaiting Phase 1 Deposit Confirmation
                </h2>
                <p className="text-[13px] text-[var(--color-warning-text)] max-w-2xl leading-relaxed">
                  Both parties have recorded their signatures on the service agreement. Project work is not yet active and begins only once the Phase 1 initial deposit stage is confirmed.
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/contract`}>
                  <Button variant="outline" size="sm">
                    View Signed Agreement
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Delivery & Post-Contract States */}
        {(project.status === 'active_phase_1' ||
          project.status === 'phase_1_review' ||
          project.status === 'awaiting_final_payment' ||
          project.status === 'active_phase_2' ||
          project.status === 'final_review' ||
          project.status === 'completed' ||
          isExceptionState) && (
          <Card className="p-6 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={statusDisplay.badgeVariant}>{statusDisplay.badgeText}</Badge>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  {statusDisplay.headline}
                </h2>
                <p className="text-[13px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                  {statusDisplay.description}
                </p>
              </div>

              {hasContractLink && (
                <div className="shrink-0">
                  <Link to={`/client/projects/${project.id}/contract`}>
                    <Button variant="outline" size="sm">
                      View Service Agreement
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {isDraft && (
          <Card className="p-5 bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-[var(--color-warning-text)] mb-1">
                Draft in Progress
              </h2>
              <p className="text-[13px] text-[var(--color-warning-text)] leading-relaxed">
                This project brief has not yet been submitted. Resume editing to complete all steps and enter curated matching.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-fit"
              onClick={() => navigate(`/client/projects/new?draftId=${project.id}`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Continue Brief
            </Button>
          </Card>
        )}

        {/* Two Column Layout: Brief Summary & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Brief Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                <Badge variant={statusDisplay.badgeVariant}>{statusDisplay.badgeText}</Badge>
                {service && (
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {service.name}
                  </span>
                )}
                {projectType && (
                  <>
                    <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                      ·
                    </span>
                    <span>{projectType.name}</span>
                  </>
                )}
              </div>

              <div>
                <h3 className="typo-card-title text-[var(--color-text-primary)] mb-2">
                  Project Description
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {brief.description || 'No description entered yet.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-[13px]">
                {brief.businessName && (
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Business Name
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] break-words">
                      {brief.businessName}
                    </span>
                  </div>
                )}
                {brief.existingUrl && (
                  <div>
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Existing URL
                    </span>
                    <a
                      href={
                        brief.existingUrl.startsWith('http')
                          ? brief.existingUrl
                          : `https://${brief.existingUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-border-strong)] underline-offset-2 truncate block hover:opacity-80"
                    >
                      {brief.existingUrl}
                    </a>
                  </div>
                )}
                {brief.targetAudience && (
                  <div className="sm:col-span-2">
                    <span className="text-[var(--color-text-secondary)] font-medium block mb-0.5">
                      Target Audience
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {brief.targetAudience}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Features & Deliverables */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                <h3 className="typo-card-title text-[var(--color-text-primary)]">
                  Required Features &amp; Scope
                </h3>
              </div>

              {brief.features && brief.features.length > 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pt-1">
                  {brief.features
                    .map((fId) => {
                      const f = allFeatures.find((item) => item.id === fId);
                      return fId === 'other' && brief.customFeatures
                        ? brief.customFeatures
                        : f?.name || fId;
                    })
                    .join(' · ')}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  General scope, open to proposal definition.
                </p>
              )}
            </Card>

            {/* Existing Assets */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                <h3 className="typo-card-title text-[var(--color-text-primary)]">
                  Existing Client Assets
                </h3>
              </div>

              {brief.existingAssets && brief.existingAssets.length > 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pt-1">
                  {brief.existingAssets
                    .map((aId) => {
                      const a = allAssets.find((item) => item.id === aId);
                      return aId === 'other' && brief.customAssets
                        ? brief.customAssets
                        : a?.name || aId;
                    })
                    .join(' · ')}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Starting from scratch (no existing assets).
                </p>
              )}
            </Card>

            {/* Additional Notes & Attachments */}
            {(brief.additionalDetails ||
              (brief.attachments && brief.attachments.length > 0)) && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                  <h3 className="typo-card-title text-[var(--color-text-primary)]">
                    Notes &amp; Attachments
                  </h3>
                </div>

                {brief.additionalDetails && (
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1">
                      Additional Notes
                    </span>
                    <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                      {brief.additionalDetails}
                    </p>
                  </div>
                )}

                {brief.attachments && brief.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums block">
                      Uploaded Documents ({brief.attachments.length})
                    </span>
                    <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-[var(--radius-button)] overflow-hidden bg-[var(--color-surface)]">
                      {brief.attachments.map((att) => (
                        <div
                          key={att.fileId}
                          className="p-3 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                            <span className="font-medium text-[var(--color-text-primary)] truncate">
                              {att.name}
                            </span>
                            <span className="text-[var(--color-text-secondary)] text-xs tabular-nums shrink-0">
                              ({(att.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>

                          {att.downloadUrl && (
                            <a
                              href={att.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--color-text-primary)] hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
                            >
                              <Download className="w-3 h-3" aria-hidden="true" /> Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Sidebar: Commercial Records, Timeline, Budget & Activity Log */}
          <div className="space-y-6">
            {/* Related Commercial Documents */}
            {(hasShortlistLink || hasProposalLink || hasContractLink) && (
              <Card className="p-6 space-y-3">
                <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Workflow Documents
                </h4>
                <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-[var(--radius-input)] overflow-hidden">
                  {hasShortlistLink && (
                    <Link
                      to={`/client/projects/${project.id}/matches`}
                      className="p-3 flex items-center justify-between gap-2 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                        <span>Curated Shortlist</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    </Link>
                  )}
                  {hasProposalLink && (
                    <Link
                      to={`/client/projects/${project.id}/proposal`}
                      className="p-3 flex items-center justify-between gap-2 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                        <span>Commercial Proposal</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    </Link>
                  )}
                  {hasContractLink && (
                    <Link
                      to={`/client/projects/${project.id}/contract`}
                      className="p-3 flex items-center justify-between gap-2 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                        <span>Service Agreement</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </Card>
            )}

            {/* Timeline & Budget Card */}
            <Card className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Euro className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Indicative Budget
                  </h4>
                </div>
                <div className="text-xl font-sans font-bold tabular-nums text-[var(--color-text-primary)] break-words">
                  {formatProjectBudget(brief.budget, lookupRangeLabel)}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Indicative brief budget range
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  <h4 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Project Timeline
                  </h4>
                </div>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Preferred Start
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                      {brief.timeline?.preferredStart === 'specific_date' &&
                      brief.timeline.startDate
                        ? `Target: ${brief.timeline.startDate}`
                        : formatTimelineOption(brief.timeline?.preferredStart || 'asap')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Desired Completion
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                      {brief.timeline?.desiredCompletion === 'specific_date' &&
                      brief.timeline.completionDate
                        ? `Deadline: ${brief.timeline.completionDate}`
                        : formatTimelineOption(brief.timeline?.desiredCompletion || 'flexible')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Flexibility
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {formatTimelineOption(
                        brief.timeline?.flexibility || 'somewhat_flexible'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Real Activity Timeline Card */}
            <Card className="p-6">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-4">
                Activity History
              </h4>

              {activities.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="relative pl-5 space-y-5 before:content-[''] before:absolute before:left-[3px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-[var(--color-border)]">
                  {activities.map((act) => (
                    <div key={act.id} className="relative">
                      <span
                        className="absolute -left-[20px] top-1.5 w-[7px] h-[7px] rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-surface)]"
                        aria-hidden="true"
                      />
                      <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {formatActivityDisplay(act.title)}
                      </div>
                      {act.description && (
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                          {formatActivityDisplay(act.description)}
                        </div>
                      )}
                      <div className="text-xs text-[var(--color-text-muted)] tabular-nums mt-1">
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
