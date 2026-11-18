import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import { shortlistService } from '../../services/shortlistService';
import { formatTimelineOption, formatActivityDisplay } from '../../utils/statusMapping';
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
  CheckCircle2,
  Layers,
  Sparkles,
  Lock,
  Download,
  AlertCircle,
  ArrowRight,
  Compass,
  FileText,
  ShieldCheck,
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

  useEffect(() => {
    async function loadData() {
      if (!projectId || !userProfile?.id) return;

      try {
        setLoading(true);
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
    }

    loadData();
  }, [projectId, userProfile?.id, userProfile?.role]);

  if (loading) {
    return (
      <DashboardLayout title="Project Details">
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">Loading project details…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="Project Details">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[var(--color-error-text)] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="typo-section-heading text-[var(--color-text-primary)]">{error || 'Project not found'}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            The project you are trying to access does not exist or you do not have permission to view it.
          </p>
          <Button variant="outline" onClick={() => navigate('/client/projects')}>
            Return to My Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const brief = project.brief;
  const service = taxonomyService.getServiceCategoryById(project.serviceId);
  const projectType = service?.projectTypes.find((pt) => pt.id === project.projectTypeId);
  const allFeatures = taxonomyService.getFeaturesForService(project.serviceId);
  const allAssets = taxonomyService.getExistingAssets();
  const budgetRange = taxonomyService
    .getBudgetRanges('EUR')
    .find((r) => r.id === brief.budget?.selectedRangeId);

  const isDraft = project.status === 'draft';
  const isSubmitted = project.status === 'submitted';
  const candidateCount = shortlist?.candidates?.length || 0;
  void snapshots;

  return (
    <DashboardLayout
      title={project.title || (isDraft ? 'Untitled Project Brief' : 'Project Details')}
      subtitle={`Created on ${new Date(project.createdAt).toLocaleDateString()}`}
      action={
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/client/projects')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            All Projects
          </Button>

          {isDraft && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/new?draftId=${project.id}`)}
            >
              Resume Draft
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

          {project.status === 'professional_selected' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/${project.id}/proposal`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Review Proposal
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Waiting / Matching Status Banner (Calm surface — not competing with CTA banners) */}
        {(isSubmitted || project.status === 'matching' || project.status === 'budget_review') && (
          <Card className="p-6 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-info-text)]">
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span>Matching in Progress</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  We're finding the right professionals
                </h2>
                <p className="text-[13px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                  Your brief was submitted on{' '}
                  <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                    {project.submittedAt
                      ? new Date(project.submittedAt).toLocaleDateString()
                      : 'today'}
                  </span>
                  . Alongby is reviewing your requirements and finding professionals who match your project.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-1.5">
                <div
                  className="px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs inline-flex items-center gap-1.5 border border-[var(--color-border)] w-fit"
                  title="Your submitted brief is locked while we find the right professionals."
                >
                  <Lock className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
                  <span className="font-medium">Brief locked</span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] max-w-[240px] text-left sm:text-right leading-snug">
                  Brief editing is locked while specialists review your scope.
                </span>
              </div>
            </div>
          </Card>
        )}

        {(project.status === 'awaiting_professional_responses' || project.status === 'shortlist_review') && (
          <Card className="p-6 border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-warning-text)]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Matching in Progress</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  Professionals are reviewing your project
                </h2>
                <p className="text-[13px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                  Matched professionals have been invited to review your project brief. We will notify you once responses have been curated.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-1.5">
                <div
                  className="px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs inline-flex items-center gap-1.5 border border-[var(--color-border)] w-fit"
                  title="Your submitted brief is locked while we find the right professionals."
                >
                  <Lock className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
                  <span className="font-medium">Brief locked</span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] max-w-[240px] text-left sm:text-right leading-snug">
                  Brief editing is locked while specialists prepare quotes.
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action Banner: Curated Matches Ready */}
        {project.status === 'shortlist_ready' && (
          <Card className="p-6 bg-[var(--color-primary)] text-white border-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#C5DBD3]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Curated Matches Ready</span>
                </div>
                <h2 className="typo-section-heading text-white">
                  Your curated professional shortlist is ready
                </h2>
                <p className="text-[13px] text-[#E8E5E0] max-w-2xl leading-relaxed">
                  {candidateCount > 0 ? (
                    <span className="text-white font-semibold tabular-nums">
                      {candidateCount === 1
                        ? '1 professional is ready to compare.'
                        : `${candidateCount} professionals are ready to compare.`}{' '}
                    </span>
                  ) : null}
                  Our curation team has hand-picked verified specialists matched to your project. Compare their quotes, scopes, and availability side-by-side, and choose your preferred partner.
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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-success-text)]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Professional Selected</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  Selection Confirmed
                </h2>
                <p className="text-[13px] text-[var(--color-success-text)] max-w-2xl leading-relaxed">
                  Next, we'll prepare the final project proposal based on the selected scope, timeline and price.
                </p>
              </div>

              <div className="shrink-0 flex items-center flex-wrap gap-2.5">
                <Link to={`/client/projects/${project.id}/matches`}>
                  <Button variant="outline" size="sm">
                    View Matches
                  </Button>
                </Link>
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Review Proposal
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action Banner: Commercial Proposal Pending */}
        {project.status === 'proposal_pending' && (
          <Card className="p-6 bg-[var(--color-primary)] text-white border-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#C8D4E4]">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Commercial Proposal Pending</span>
                </div>
                <h2 className="typo-section-heading text-white">
                  Commercial Proposal Ready for Review
                </h2>
                <p className="text-[13px] text-[#E8E5E0] max-w-2xl leading-relaxed">
                  The formal proposal detailing deliverables, milestone splits, and revision terms is pending mutual signoff before contract execution.
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button
                    variant="white"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review & Accept Proposal
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action Banner: Master Agreement Pending Signatures */}
        {(project.status === 'proposal_accepted' ||
          project.status === 'contract_pending' ||
          project.status === 'awaiting_signatures') && (
          <Card className="p-6 bg-[var(--color-primary)] text-white border-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#E8D2B5]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Master Agreement Pending</span>
                </div>
                <h2 className="typo-section-heading text-white">
                  Master Services Agreement Awaiting Signature
                </h2>
                <p className="text-[13px] text-[#E8E5E0] max-w-2xl leading-relaxed">
                  The proposal was formally accepted. Complete electronic execution under EU eIDAS and US ESIGN standards.
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/contract`}>
                  <Button
                    variant="white"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review & Sign Contract
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Confirmed State: Contract Executed / Awaiting Deposit */}
        {project.status === 'awaiting_deposit' && (
          <Card className="p-6 bg-[var(--color-success-bg)] border-[var(--color-success-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-success-text)]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Contract Fully Executed</span>
                </div>
                <h2 className="typo-section-heading text-[var(--color-text-primary)]">
                  Awaiting Phase 1 Initial Deposit
                </h2>
                <p className="text-[13px] text-[var(--color-success-text)] max-w-2xl leading-relaxed tabular-nums">
                  Both parties have completed electronic signatures. The agreement is legally binding. Project work will activate upon funding Phase 1 initial deposit (50% upfront deposit).
                </p>
              </div>

              <div className="shrink-0">
                <Link to={`/client/projects/${project.id}/contract`}>
                  <Button variant="outline" size="sm">
                    View Signed Contract
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {isDraft && (
          <Card className="p-5 bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-[var(--color-warning-text)] uppercase tracking-[0.06em] mb-1">
                Draft in Progress
              </h3>
              <p className="text-[13px] text-[var(--color-warning-text)] leading-relaxed">
                This project has not yet been submitted. Resume editing to complete the brief and enter the curation queue.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-fit"
              onClick={() => navigate(`/client/projects/new?draftId=${project.id}`)}
            >
              Continue Brief
            </Button>
          </Card>
        )}

        {/* Two Column Layout: Brief Summary & Activity Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Brief Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Essential Meta Card */}
            <Card className="p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--color-border)]">
                {isDraft && <Badge variant="warning">Draft</Badge>}
                {service && <Badge variant="neutral">{service.name}</Badge>}
                {projectType && (
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    · {projectType.name}
                  </span>
                )}
              </div>

              <div>
                <h3 className="typo-card-title text-[var(--color-text-primary)] mb-2">
                  Project Description
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {brief.description}
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
                      href={brief.existingUrl.startsWith('http') ? brief.existingUrl : `https://${brief.existingUrl}`}
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
                <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
                <h3 className="typo-card-title text-[var(--color-text-primary)]">
                  Required Features & Scope
                </h3>
              </div>

              {brief.features && brief.features.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {brief.features.map((fId) => {
                    const f = allFeatures.find((item) => item.id === fId);
                    return (
                      <span
                        key={fId}
                        className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs font-medium"
                      >
                        {fId === 'other' && brief.customFeatures ? brief.customFeatures : f?.name || fId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  General scope, open to proposal definition.
                </p>
              )}
            </Card>

            {/* Existing Assets */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
                <h3 className="typo-card-title text-[var(--color-text-primary)]">
                  Existing Client Assets
                </h3>
              </div>

              {brief.existingAssets && brief.existingAssets.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {brief.existingAssets.map((aId) => {
                    const a = allAssets.find((item) => item.id === aId);
                    return (
                      <span
                        key={aId}
                        className="px-2.5 py-1 rounded-[6px] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-xs font-medium"
                      >
                        {aId === 'other' && brief.customAssets ? brief.customAssets : a?.name || aId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Starting from scratch (no existing assets).
                </p>
              )}
            </Card>

            {/* Additional Notes & Attachments */}
            {(brief.additionalDetails || (brief.attachments && brief.attachments.length > 0)) && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
                  <h3 className="typo-card-title text-[var(--color-text-primary)]">
                    Notes & Attachments
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
                            <Paperclip className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
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
                              <Download className="w-3 h-3" /> Download
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

          {/* Right Sidebar: Timeline, Budget & Activity Log (1 col) */}
          <div className="space-y-6">
            {/* Timeline & Budget Card */}
            <Card className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Euro className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.06em]">
                    Indicative Budget
                  </h4>
                </div>
                <div className="text-xl font-sans font-bold tabular-nums text-[var(--color-text-primary)] break-words">
                  {brief.budget?.budgetType === 'unsure'
                    ? 'I am not sure'
                    : budgetRange?.label || '€2,000 – €3,500'}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Your budget range
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.06em]">
                    Project Timeline
                  </h4>
                </div>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Preferred Start
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                      {brief.timeline?.preferredStart === 'specific_date' && brief.timeline.startDate
                        ? `Target: ${brief.timeline.startDate}`
                        : formatTimelineOption(brief.timeline?.preferredStart || 'asap')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Desired Completion
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                      {brief.timeline?.desiredCompletion === 'specific_date' && brief.timeline.completionDate
                        ? `Deadline: ${brief.timeline.completionDate}`
                        : formatTimelineOption(brief.timeline?.desiredCompletion || 'flexible')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                      Flexibility
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {formatTimelineOption(brief.timeline?.flexibility || 'somewhat_flexible')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Real Activity Timeline Card */}
            <Card className="p-6">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.06em] mb-4">
                Activity History
              </h4>

              {activities.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">No activity recorded yet.</p>
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
                      <div className="text-xs text-[var(--color-text-secondary)] tabular-nums mt-1">
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

