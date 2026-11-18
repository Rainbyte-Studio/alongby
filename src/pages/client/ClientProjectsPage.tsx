import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/SearchInput';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Plus,
  FolderKanban,
  Calendar,
  Euro,
  ArrowRight,
} from 'lucide-react';
import { DraftActionMenu } from '../../components/client/DraftActionMenu';

type ProjectFilterTab = 'all' | 'action' | 'submitted' | 'draft';

export const ClientProjectsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await projectService.getClientProjects(userProfile.id);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load client projects:', err);
      setLoadError('Unable to load your projects right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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

  const needsActionCount = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.status === 'shortlist_ready' ||
          p.status === 'professional_selected' ||
          p.status === 'proposal_pending' ||
          p.status === 'proposal_accepted' ||
          p.status === 'contract_pending' ||
          p.status === 'awaiting_signatures' ||
          p.status === 'phase_1_review' ||
          p.status === 'final_review'
      ).length,
    [projects]
  );

  const draftCount = useMemo(
    () => projects.filter((p) => p.status === 'draft').length,
    [projects]
  );

  const submittedCount = useMemo(
    () => projects.filter((p) => p.status !== 'draft').length,
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeTab === 'draft' && p.status !== 'draft') return false;
      if (activeTab === 'submitted' && p.status === 'draft') return false;
      if (
        activeTab === 'action' &&
        !(
          p.status === 'shortlist_ready' ||
          p.status === 'professional_selected' ||
          p.status === 'proposal_pending' ||
          p.status === 'proposal_accepted' ||
          p.status === 'contract_pending' ||
          p.status === 'awaiting_signatures' ||
          p.status === 'phase_1_review' ||
          p.status === 'final_review'
        )
      ) {
        return false;
      }

      if (q) {
        const serviceName =
          taxonomyService.getServiceCategoryById(p.serviceId)?.name.toLowerCase() || '';
        const title = (p.title || '').toLowerCase();
        const desc = (p.brief?.description || '').toLowerCase();
        return title.includes(q) || serviceName.includes(q) || desc.includes(q);
      }

      return true;
    });
  }, [projects, activeTab, searchQuery]);

  const formatTimeline = (project: Project) => {
    const t = project.brief?.timeline;
    if (!t) return 'Timeline flexible';
    if (t.desiredCompletion === 'specific_date' && t.completionDate) {
      return `Target ${t.completionDate}`;
    }
    return formatTimelineOption(t.desiredCompletion);
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Client Workspace', to: '/client' },
        { label: 'My Projects' },
      ]}
      title="My Projects"
      subtitle="Track your submitted briefs, compare curated shortlists, and manage proposals and service agreements."
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
      <div className="space-y-6">
        {successToast && (
          <Alert variant="success" onDismiss={() => setSuccessToast(null)}>
            {successToast}
          </Alert>
        )}

        {loadError && (
          <Alert
            variant="error"
            title="Could not load projects"
            onRetry={loadProjects}
          >
            {loadError}
          </Alert>
        )}

        {/* Standardized Tabs + Search Filter */}
        <div className="space-y-4">
          <Tabs
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as ProjectFilterTab)}
            ariaLabel="Filter projects by status"
            className="mb-0"
            tabs={[
              { id: 'all', label: 'All Projects', badge: projects.length },
              { id: 'action', label: 'Needs Review', badge: needsActionCount },
              { id: 'submitted', label: 'Submitted & Active', badge: submittedCount },
              { id: 'draft', label: 'Drafts', badge: draftCount },
            ]}
          />

          {projects.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-full sm:max-w-xs">
                <SearchInput
                  aria-label="Search projects"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search by title or service…"
                />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] tabular-nums">
                Showing {filteredProjects.length} of {projects.length}{' '}
                {projects.length === 1 ? 'project' : 'projects'}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <Card className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner size="md" label="Loading your projects…" />
          </Card>
        ) : filteredProjects.length === 0 ? (
          searchQuery.trim() ? (
            <EmptyState
              icon={FolderKanban}
              title="No matching projects"
              description={`No projects matched "${searchQuery.trim()}". Clear the search filter or switch status tabs.`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title={
                activeTab === 'draft'
                  ? 'No draft projects'
                  : activeTab === 'action'
                  ? 'No projects awaiting your review'
                  : activeTab === 'submitted'
                  ? 'No submitted projects yet'
                  : 'No projects created yet'
              }
              description={
                activeTab === 'action'
                  ? 'All submitted briefs are currently progressing without pending client sign-off.'
                  : 'Define your digital or creative requirements in a structured brief to receive 2–3 curated specialist proposals.'
              }
              actionLabel={activeTab === 'action' ? 'View All Projects' : 'Start a Project Brief'}
              onAction={() =>
                activeTab === 'action' ? setActiveTab('all') : navigate('/client/projects/new')
              }
            />
          )
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const service = taxonomyService.getServiceCategoryById(project.serviceId);
              const statusInfo = getClientProjectStatusDisplay(project.status, project.submittedAt);
              const isDraft = project.status === 'draft';

              return (
                <Card
                  key={project.id}
                  className="p-5 sm:p-6 transition-colors hover:border-[var(--color-border-strong)] flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
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
                        {isDraft ? 'Draft updated' : 'Updated'}{' '}
                        {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="typo-card-title text-[var(--color-text-primary)]">
                      {project.title || 'Untitled Project Brief'}
                    </h3>

                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {project.brief?.description || 'No description provided yet.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[var(--color-text-secondary)] pt-1">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] tabular-nums">
                        <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                        {formatProjectBudget(project.brief?.budget, lookupRangeLabel)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
                        {formatTimeline(project)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                    {isDraft ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/client/projects/new?draftId=${project.id}`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Continue Brief
                        </Button>
                        <DraftActionMenu
                          project={project}
                          onRenamed={(newTitle) => handleProjectRenamed(project.id, newTitle)}
                          onDeleted={() => handleProjectDeleted(project.id)}
                        />
                      </div>
                    ) : project.status === 'shortlist_ready' ? (
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
                          onClick={() => navigate(`/client/projects/${project.id}/matches`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          View Your Matches
                        </Button>
                      </div>
                    ) : project.status === 'professional_selected' ||
                      project.status === 'proposal_pending' ? (
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
                          onClick={() => navigate(`/client/projects/${project.id}/proposal`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Review Proposal
                        </Button>
                      </div>
                    ) : project.status === 'proposal_accepted' ||
                      project.status === 'contract_pending' ||
                      project.status === 'awaiting_signatures' ? (
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
                          onClick={() => navigate(`/client/projects/${project.id}/contract`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Review Agreement
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/projects/${project.id}`)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        View Project
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
