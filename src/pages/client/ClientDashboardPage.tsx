import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import {
  formatProjectBudget,
  formatTimelineOption,
  getClientProjectStatusDisplay,
} from '../../utils/statusMapping';
import { Project } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Plus,
  FolderKanban,
  Building,
  Globe,
  MapPin,
  Clock,
  ArrowRight,
  Euro,
  Calendar,
  Edit3,
} from 'lucide-react';
import { DraftActionMenu } from '../../components/client/DraftActionMenu';

function getProjectPrimaryAction(project: Project): {
  label: string;
  to: string;
  variant: 'primary' | 'outline';
} {
  switch (project.status) {
    case 'draft':
      return {
        label: 'Continue Brief',
        to: `/client/projects/new?draftId=${project.id}`,
        variant: 'primary',
      };
    case 'shortlist_ready':
      return {
        label: 'View Your Matches',
        to: `/client/projects/${project.id}/matches`,
        variant: 'primary',
      };
    case 'professional_selected':
    case 'proposal_pending':
      return {
        label: 'Review Proposal',
        to: `/client/projects/${project.id}/proposal`,
        variant: 'primary',
      };
    case 'proposal_accepted':
    case 'contract_pending':
    case 'awaiting_signatures':
      return {
        label: 'Review Agreement',
        to: `/client/projects/${project.id}/contract`,
        variant: 'primary',
      };
    default:
      return {
        label: 'View Project',
        to: `/client/projects/${project.id}`,
        variant: 'outline',
      };
  }
}

export const ClientDashboardPage: React.FC = () => {
  const { userProfile, clientProfile } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const clientName = clientProfile?.fullName || userProfile?.displayName || 'Client';

  const fetchRecentProjects = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      setLoadingProjects(true);
      setLoadError(null);
      const list = await projectService.getClientProjects(userProfile.id);
      setProjects(list);
    } catch (err) {
      console.error('Failed to load recent projects:', err);
      setLoadError('Unable to load your projects right now. Please try again.');
    } finally {
      setLoadingProjects(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchRecentProjects();
  }, [fetchRecentProjects]);

  const handleProjectRenamed = (projectId: string, newTitle: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              title: newTitle,
              brief: { ...p.brief, title: newTitle },
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    setSuccessToast(`Draft renamed to "${newTitle}".`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSuccessToast('Draft deleted.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const budgetRanges = taxonomyService.getBudgetRanges('EUR');
  const lookupRangeLabel = (id: string) => budgetRanges.find((r) => r.id === id)?.label;

  const draftProjects = projects.filter((p) => p.status === 'draft');
  const activeProjects = projects.filter(
    (p) => p.status !== 'draft' && p.status !== 'cancelled' && p.status !== 'completed'
  );
  const attentionProjects = projects.filter(
    (p) =>
      p.status === 'shortlist_ready' ||
      p.status === 'professional_selected' ||
      p.status === 'proposal_pending' ||
      p.status === 'proposal_accepted' ||
      p.status === 'contract_pending' ||
      p.status === 'awaiting_signatures' ||
      p.status === 'phase_1_review' ||
      p.status === 'final_review'
  );

  const recentProjects = projects.slice(0, 4);

  const formatTimeline = (project: Project) => {
    const t = project.brief?.timeline;
    if (!t) return 'Flexible timeline';
    if (t.desiredCompletion === 'specific_date' && t.completionDate) {
      return `Target ${t.completionDate}`;
    }
    return formatTimelineOption(t.desiredCompletion);
  };

  return (
    <DashboardLayout
      eyebrow="Client Workspace"
      title={`Welcome, ${clientName}`}
      subtitle="Define structured briefs, compare curated specialists, and review commercial proposals and agreements."
      action={
        <Button
          variant="primary"
          onClick={() => navigate('/client/projects/new')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Start a Project
        </Button>
      }
    >
      <div className="space-y-8">
        {successToast && (
          <Alert variant="success" onDismiss={() => setSuccessToast(null)}>
            {successToast}
          </Alert>
        )}

        {loadError && (
          <Alert
            variant="error"
            title="Could not load projects"
            onRetry={fetchRecentProjects}
          >
            {loadError}
          </Alert>
        )}

        {/* Overview Metrics Strip (Supported strictly by real project data) */}
        <section aria-label="Project overview metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 sm:p-5">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Total Projects
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {projects.length}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)] tabular-nums">
                {projects.filter((p) => p.status !== 'draft').length} submitted · {draftProjects.length} draft
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Active Workflow
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {activeProjects.length}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                Matching, proposal or delivery
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Awaiting Your Review
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {attentionProjects.length}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                Shortlist, proposal or signature
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                Unsubmitted Drafts
              </div>
              <div className="mt-1.5 text-2xl sm:text-3xl font-sans font-bold tabular-nums text-[var(--color-text-primary)]">
                {draftProjects.length}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                Saved briefs in progress
              </div>
            </Card>
          </div>
        </section>

        {/* Items Requiring Attention */}
        {!loadingProjects && attentionProjects.length > 0 && (
          <section aria-labelledby="client-attention-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="client-attention-heading"
                className="typo-section-heading text-[var(--color-text-primary)]"
              >
                Requires Your Attention
              </h2>
              <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                {attentionProjects.length} {attentionProjects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            <div className="space-y-3">
              {attentionProjects.map((project) => {
                const statusInfo = getClientProjectStatusDisplay(project.status, project.submittedAt);
                const primaryAction = getProjectPrimaryAction(project);
                return (
                  <Card
                    key={`attn-${project.id}`}
                    className="p-4 sm:p-5 border-[var(--color-border-strong)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusInfo.badgeVariant}>{statusInfo.badgeText}</Badge>
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                          {statusInfo.headline}
                        </span>
                      </div>
                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        {project.title || 'Untitled Project'}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                        {statusInfo.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/projects/${project.id}`)}
                      >
                        Project Brief
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(primaryAction.to)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {primaryAction.label}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Projects List */}
        <section aria-labelledby="client-recent-projects-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="client-recent-projects-heading"
              className="typo-section-heading text-[var(--color-text-primary)]"
            >
              Recent Projects
            </h2>
            {projects.length > 0 && (
              <Link
                to="/client/projects"
                className="text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)] hover:underline underline-offset-4 inline-flex items-center gap-1 shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <span>View all ({projects.length})</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>

          {loadingProjects ? (
            <Card className="py-14 flex flex-col items-center justify-center">
              <LoadingSpinner size="sm" label="Loading projects…" />
            </Card>
          ) : recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects created yet"
              description="Define your scope, timeline, and indicative budget in a structured brief. Alongby curates verified specialists and presents comparable quotes."
              actionLabel="Start a Project Brief"
              onAction={() => navigate('/client/projects/new')}
            />
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => {
                const service = taxonomyService.getServiceCategoryById(project.serviceId);
                const statusInfo = getClientProjectStatusDisplay(project.status, project.submittedAt);
                const primaryAction = getProjectPrimaryAction(project);
                const isDraft = project.status === 'draft';

                return (
                  <Card
                    key={project.id}
                    className="p-5 transition-colors hover:border-[var(--color-border-strong)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                        <Badge variant={statusInfo.badgeVariant}>{statusInfo.badgeText}</Badge>
                        {service && (
                          <>
                            <span className="font-medium text-[var(--color-text-primary)]">
                              {service.name}
                            </span>
                            <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                              ·
                            </span>
                          </>
                        )}
                        <span className="text-[var(--color-text-muted)] tabular-nums">
                          Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="typo-card-title text-[var(--color-text-primary)]">
                        {project.title || 'Untitled Project Brief'}
                      </h3>

                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                        {project.brief?.description || 'No project description entered yet.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)] pt-0.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] tabular-nums">
                          <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          {formatProjectBudget(project.brief?.budget, lookupRangeLabel)}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                          {formatTimeline(project)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                      {isDraft ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(primaryAction.to)}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {primaryAction.label}
                          </Button>
                          <DraftActionMenu
                            project={project}
                            onRenamed={(newTitle) => handleProjectRenamed(project.id, newTitle)}
                            onDeleted={() => handleProjectDeleted(project.id)}
                          />
                        </div>
                      ) : primaryAction.variant === 'primary' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/client/projects/${project.id}`)}
                          >
                            Brief
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(primaryAction.to)}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {primaryAction.label}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(primaryAction.to)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          {primaryAction.label}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Client Account & Organization Context */}
        <section aria-labelledby="client-account-summary-heading">
          <Card className="p-5 sm:p-6 bg-[var(--color-surface)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Account &amp; Organization
                </div>
                <h2
                  id="client-account-summary-heading"
                  className="typo-card-title text-[var(--color-text-primary)]"
                >
                  {clientName}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--color-text-secondary)]">
                  {clientProfile?.companyName && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                      {clientProfile.companyName}
                    </span>
                  )}
                  {clientProfile?.companyWebsite && (
                    <span className="inline-flex items-center gap-1.5 break-all">
                      <Globe className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                      {clientProfile.companyWebsite}
                    </span>
                  )}
                  {clientProfile?.country && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                      {clientProfile.country}
                    </span>
                  )}
                  {clientProfile?.timezone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                      {clientProfile.timezone}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  id="client-edit-profile-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/client/profile')}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
};
