import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import { getClientProjectStatusDisplay } from '../../utils/statusMapping';
import { Project } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { DraftActionMenu } from '../../components/client/DraftActionMenu';

export const ClientDashboardPage: React.FC = () => {
  const { userProfile, clientProfile } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const clientName = clientProfile?.fullName || userProfile?.displayName || 'Client';

  useEffect(() => {
    async function fetchRecentProjects() {
      if (!userProfile?.id) return;
      try {
        setLoadingProjects(true);
        const list = await projectService.getClientProjects(userProfile.id);
        setProjects(list);
      } catch (err) {
        console.error('Failed to load recent projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchRecentProjects();
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

  const draftCount = projects.filter((p) => p.status === 'draft').length;
  const submittedCount = projects.filter((p) => p.status !== 'draft').length;
  const draftLabel = `${draftCount} ${draftCount === 1 ? 'draft' : 'drafts'}`;
  const projectLabel = `${submittedCount} ${submittedCount === 1 ? 'project' : 'projects'}`;

  const getStatusBadge = (status: string) => {
    const display = getClientProjectStatusDisplay(status);
    return <Badge variant={display.badgeVariant}>{display.badgeText}</Badge>;
  };

  const recentProjects = projects.slice(0, 3);

  return (
    <DashboardLayout
      title={`Welcome, ${clientName}`}
      subtitle="Manage your projects, review curated professional shortlists, and track staged milestones."
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
      {/* Client Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Client Account
              </div>
              <Button
                id="client-edit-profile-btn"
                variant="outline"
                size="sm"
                onClick={() => navigate('/client/profile')}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                className="text-xs h-7 py-1 px-2.5"
              >
                Edit Profile
              </Button>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-1">
              {clientName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-neutral-500">
              {clientProfile?.companyName && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-neutral-400" />
                  {clientProfile.companyName}
                </span>
              )}
              {clientProfile?.companyWebsite && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  {clientProfile.companyWebsite}
                </span>
              )}
              {clientProfile?.country && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {clientProfile.country}
                </span>
              )}
              {clientProfile?.timezone && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  {clientProfile.timezone}
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Curation Service Status:</span>
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Ready for project briefs
            </span>
          </div>
        </Card>

        {/* Status card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Projects & Drafts
            </div>
            <div className="text-3xl font-serif font-bold text-neutral-900 mb-1">
              {projects.length}
            </div>
            <p className="text-xs text-neutral-500">
              {draftLabel} · {projectLabel}
            </p>
          </div>
          <div className="text-xs text-neutral-400 pt-4 border-t border-neutral-100">
            Staged payment protection
          </div>
        </Card>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
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

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Recent Projects
          </h2>
          {projects.length > 0 && (
            <Link
              to="/client/projects"
              className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1"
            >
              View all ({projects.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {loadingProjects ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="sm" />
            <p className="mt-2 text-xs text-neutral-500">Loading projects…</p>
          </div>
        ) : recentProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects created yet"
            description="Tell Alongby what digital or creative project you need. Our curation engine will score verified professionals and deliver bespoke proposals."
            actionLabel="Start a Project Brief"
            onAction={() => navigate('/client/projects/new')}
          />
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => {
              const service = taxonomyService.getServiceCategoryById(project.serviceId);
              const isDraft = project.status === 'draft';

              return (
                <Card
                  key={project.id}
                  className="p-5 transition-all hover:border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(project.status)}
                      {service && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                          {service.name}
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400">
                        {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-950 truncate">
                      {project.title || 'Untitled Project Brief'}
                    </h3>

                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {project.brief?.description || 'No description provided yet.'}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
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
