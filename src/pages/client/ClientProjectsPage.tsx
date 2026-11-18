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
        <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'all'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          All ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'draft'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Drafts ({projects.filter((p) => p.status === 'draft').length})
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'submitted'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Submitted ({projects.filter((p) => p.status !== 'draft').length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="md" />
          <p className="mt-3 text-xs text-neutral-500">Loading your projects…</p>
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
                className="p-6 transition-all hover:border-neutral-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(project.status)}
                    {service && (
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                        {service.name}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">
                      {isDraft ? 'Draft updated' : 'Submitted'}:{' '}
                      {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-950 truncate">
                    {project.title || 'Untitled Project Brief'}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {project.brief?.description || 'No description provided yet.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Euro className="w-3.5 h-3.5 text-neutral-400" />
                      {formatBudget(project)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      {formatTimeline(project)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100">
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
                    <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-2">
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
