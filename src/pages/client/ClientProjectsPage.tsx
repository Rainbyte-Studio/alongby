import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import { getClientProjectStatusDisplay } from '../../utils/statusMapping';
import { Project } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Plus,
  FolderKanban,
  Calendar,
  Euro,
  ArrowRight,
  FileEdit,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { DraftActionMenu } from '../../components/client/DraftActionMenu';

export const ClientProjectsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'submitted'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      if (!userProfile?.id) return;
      try {
        setLoading(true);
        const data = await projectService.getClientProjects(userProfile.id);
        setProjects(data);
      } catch (err) {
        console.error('Failed to load client projects:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [userProfile?.id]);

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
    setSuccessToast('Draft deleted successfully.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'draft') return p.status === 'draft';
    if (activeTab === 'submitted') return p.status !== 'draft';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const display = getClientProjectStatusDisplay(status);
    return <Badge variant={display.badgeVariant}>{display.badgeText}</Badge>;
  };

  const formatTimeline = (project: Project) => {
    const t = project.brief?.timeline;
    if (!t) return 'Timeline flexible';
    if (t.desiredCompletion === 'specific_date' && t.completionDate) {
      return `Target: ${t.completionDate}`;
    }
    if (t.desiredCompletion === 'two_four_weeks') return '2–4 weeks';
    if (t.desiredCompletion === 'one_two_months') return '1–2 months';
    if (t.desiredCompletion === 'two_three_months') return '2–3 months';
    if (t.desiredCompletion === 'three_plus_months') return '3+ months';
    return 'Flexible duration';
  };

  const formatBudget = (project: Project) => {
    const b = project.brief?.budget;
    if (!b || b.budgetType === 'unsure') return 'Budget open to proposals';
    if (b.selectedRangeId) {
      const range = taxonomyService
        .getBudgetRanges('EUR')
        .find((r) => r.id === b.selectedRangeId);
      if (range) return range.label;
    }
    return '€2,000 – €3,500';
  };

  return (
    <DashboardLayout
      title="My Projects"
      subtitle="Track your active project briefs, submitted requirements, and ongoing engagements."
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
      {/* Success Notification Banner */}
      {successToast && (
        <div className="mb-6 p-3.5 rounded-[var(--radius-button)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-text)] text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-[var(--color-success-text)] hover:text-[var(--color-text-primary)] text-xs font-semibold cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[var(--color-border)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 min-h-[38px] rounded-[var(--radius-button)] text-[13px] font-medium tabular-nums cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
          }`}
        >
          All ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('draft')}
          className={`px-3.5 min-h-[38px] rounded-[var(--radius-button)] text-[13px] font-medium tabular-nums cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] whitespace-nowrap ${
            activeTab === 'draft'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
          }`}
        >
          Drafts ({projects.filter((p) => p.status === 'draft').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submitted')}
          className={`px-3.5 min-h-[38px] rounded-[var(--radius-button)] text-[13px] font-medium tabular-nums cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] whitespace-nowrap ${
            activeTab === 'submitted'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
          }`}
        >
          Submitted ({projects.filter((p) => p.status !== 'draft').length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="md" label="Loading your projects…" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={
            activeTab === 'draft'
              ? 'No draft projects'
              : activeTab === 'submitted'
              ? 'No submitted projects yet'
              : 'No projects created yet'
          }
          description="Tell Alongby what digital or creative project you need. Our curation engine will score verified professionals and deliver 2–3 bespoke proposals."
          actionLabel="Start a Project Brief"
          onAction={() => navigate('/client/projects/new')}
        />
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const service = taxonomyService.getServiceCategoryById(project.serviceId);
            const isDraft = project.status === 'draft';

            return (
              <Card
                key={project.id}
                className="p-5 sm:p-6 transition-colors hover:border-[var(--color-border-strong)] flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                    {getStatusBadge(project.status)}
                    {service && (
                      <>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {service.name}
                        </span>
                        <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="text-[var(--color-text-muted)] tabular-nums">
                      {isDraft ? 'Draft updated' : 'Submitted'}:{' '}
                      {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="typo-card-title text-[var(--color-text-primary)] break-words">
                    {project.title || 'Untitled Project Brief'}
                  </h3>

                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                    {project.brief?.description || 'No description provided yet.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[var(--color-text-secondary)] pt-1">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)] tabular-nums">
                      <Euro className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      {formatBudget(project)}
                    </span>
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
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
                        View Matches
                      </Button>
                    </div>
                  ) : project.status === 'professional_selected' ? (
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
                        Proposal
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
    </DashboardLayout>
  );
};
