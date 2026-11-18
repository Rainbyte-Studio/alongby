import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import { shortlistService } from '../../services/shortlistService';
import { getClientProjectStatusDisplay, formatTimelineOption, formatActivityDisplay } from '../../utils/statusMapping';
import { Project, ProjectBriefSnapshot, ActivityEvent, PublishedShortlist } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Euro,
  FileCheck,
  Paperclip,
  CheckCircle2,
  Layers,
  Sparkles,
  Lock,
  Download,
  AlertCircle,
  ArrowRight,
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
          <p className="mt-4 text-xs text-neutral-500">Loading project details…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="Project Details">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">{error || 'Project not found'}</h2>
          <p className="text-xs text-neutral-500">
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
  const goals = taxonomyService.getProjectGoals();
  const budgetRange = taxonomyService
    .getBudgetRanges('EUR')
    .find((r) => r.id === brief.budget?.selectedRangeId);

  const isDraft = project.status === 'draft';
  const isSubmitted = project.status === 'submitted';
  const candidateCount = shortlist?.candidates?.length || 0;

  return (
    <DashboardLayout
      title={project.title || (isDraft ? 'Untitled Project Brief' : 'Project Details')}
      subtitle={`Created on ${new Date(project.createdAt).toLocaleDateString()}`}
      action={
        <div className="flex items-center gap-2">
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
        {/* Calm Lifecycle Status Banner */}
        {(isSubmitted || project.status === 'matching' || project.status === 'budget_review') && (
          <Card className="p-6 bg-neutral-900 text-white border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Project Status: Matching in Progress
                  </span>
                </div>
                <h2 className="text-lg font-serif font-bold text-white">
                  We're finding the right professionals
                </h2>
                <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                  Your brief was submitted on{' '}
                  {project.submittedAt
                    ? new Date(project.submittedAt).toLocaleDateString()
                    : 'today'}
                  . Alongby is reviewing your requirements and finding professionals who match your project.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-1">
                <div
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs flex items-center gap-1.5 border border-neutral-700"
                  title="Your submitted brief is locked while we find the right professionals."
                >
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-medium">Brief locked</span>
                </div>
                <span className="text-[11px] text-neutral-400 max-w-[220px] text-left sm:text-right leading-tight">
                  Your submitted brief is locked while we find the right professionals.
                </span>
              </div>
            </div>
          </Card>
        )}

        {(project.status === 'awaiting_professional_responses' || project.status === 'shortlist_review') && (
          <Card className="p-6 bg-neutral-900 text-white border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Project Status: Matching in Progress
                  </span>
                </div>
                <h2 className="text-lg font-serif font-bold text-white">
                  Professionals are reviewing your project
                </h2>
                <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                  Matched professionals have been invited to review your project brief. We will notify you once responses have been curated.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-1">
                <div
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs flex items-center gap-1.5 border border-neutral-700"
                  title="Your submitted brief is locked while we find the right professionals."
                >
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-medium">Brief locked</span>
                </div>
                <span className="text-[11px] text-neutral-400 max-w-[220px] text-left sm:text-right leading-tight">
                  Your submitted brief is locked while we find the right professionals.
                </span>
              </div>
            </div>
          </Card>
        )}

        {project.status === 'shortlist_ready' && (
          <Card className="p-6 bg-stone-950 text-white border-stone-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Curated Matches Ready
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Your curated professional shortlist is ready
                </h2>
                <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
                  {candidateCount > 0 ? (
                    <span className="text-white font-medium">
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
                    className="font-semibold text-stone-900 bg-white hover:bg-stone-100 shadow-sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    View Your Matches
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {project.status === 'professional_selected' && (
          <Card className="p-6 bg-emerald-900 text-white border-emerald-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Professional selected
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Selection Confirmed
                </h2>
                <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                  Next, we'll prepare the final project proposal based on the selected scope, timeline and price.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link to={`/client/projects/${project.id}/matches`}>
                  <Button variant="outline" size="sm" className="bg-transparent text-white border-emerald-400/50 hover:bg-emerald-800">
                    View Matches
                  </Button>
                </Link>
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button variant="white" size="sm" className="font-medium" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Review Proposal
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {project.status === 'proposal_pending' && (
          <Card className="p-6 bg-sky-950 text-white border-sky-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                    Commercial Proposal Pending
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Commercial Proposal Ready for Review
                </h2>
                <p className="text-xs text-sky-200 max-w-2xl leading-relaxed">
                  The formal proposal detailing deliverables, milestone splits, and revision terms is pending mutual signoff before contract execution.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link to={`/client/projects/${project.id}/proposal`}>
                  <Button variant="primary" size="md" className="bg-white text-sky-950 hover:bg-sky-50 font-medium">
                    Review & Accept Proposal
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {(project.status === 'proposal_accepted' ||
          project.status === 'contract_pending' ||
          project.status === 'awaiting_signatures') && (
          <Card className="p-6 bg-stone-900 text-white border-stone-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Master Agreement Pending
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Master Services Agreement Awaiting Signature
                </h2>
                <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
                  The proposal was formally accepted. Complete electronic execution under EU eIDAS and US ESIGN standards.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link to={`/client/projects/${project.id}/contract`}>
                  <Button variant="primary" size="md" className="bg-white text-stone-950 hover:bg-stone-100 font-medium">
                    Review & Sign Contract
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {project.status === 'awaiting_deposit' && (
          <Card className="p-6 bg-emerald-950 text-white border-emerald-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Contract Fully Executed
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Awaiting Phase 1 Initial Deposit
                </h2>
                <p className="text-xs text-emerald-200 max-w-2xl leading-relaxed">
                  Both parties have completed electronic signatures. The agreement is legally binding. Project work will activate upon funding Phase 1 initial deposit (50% upfront deposit).
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link to={`/client/projects/${project.id}/contract`}>
                  <Button variant="outline" size="sm" className="bg-transparent text-white border-white/40 hover:bg-white/10">
                    View Signed Contract
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {isDraft && (
          <Card className="p-5 bg-amber-50/70 border-amber-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">
                Draft in Progress
              </h3>
              <p className="text-xs text-amber-800">
                This project has not yet been submitted. Resume editing to complete the brief and enter the curation queue.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/client/projects/new?draftId=${project.id}`)}
            >
              Continue Brief
            </Button>
          </Card>
        )}

        {/* Two Column Layout: Brief Summary & Activity Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Brief Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Essential Meta Card */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  {isDraft && (
                    <Badge variant="warning">Draft</Badge>
                  )}
                  {service && (
                    <Badge variant="neutral">{service.name}</Badge>
                  )}
                  {projectType && (
                    <span className="text-xs text-neutral-500 font-medium">
                      • {projectType.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Project Description
                </h3>
                <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {brief.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                {brief.businessName && (
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Business Name</span>
                    <span className="font-medium text-neutral-900">{brief.businessName}</span>
                  </div>
                )}
                {brief.existingUrl && (
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Existing URL</span>
                    <a
                      href={brief.existingUrl.startsWith('http') ? brief.existingUrl : `https://${brief.existingUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-neutral-900 underline truncate block"
                    >
                      {brief.existingUrl}
                    </a>
                  </div>
                )}
                {brief.targetAudience && (
                  <div className="sm:col-span-2">
                    <span className="text-neutral-400 block mb-0.5">Target Audience</span>
                    <span className="font-medium text-neutral-900">{brief.targetAudience}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Features & Deliverables */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-600" />
                <h3 className="text-sm font-semibold text-neutral-900">
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
                        className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-medium"
                      >
                        {fId === 'other' && brief.customFeatures ? brief.customFeatures : f?.name || fId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">General scope, open to proposal definition.</p>
              )}
            </Card>

            {/* Existing Assets */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-neutral-600" />
                <h3 className="text-sm font-semibold text-neutral-900">
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
                        className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-medium"
                      >
                        {aId === 'other' && brief.customAssets ? brief.customAssets : a?.name || aId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Starting from scratch (no existing assets).</p>
              )}
            </Card>

            {/* Additional Notes & Attachments */}
            {(brief.additionalDetails || (brief.attachments && brief.attachments.length > 0)) && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-neutral-600" />
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Notes & Attachments
                  </h3>
                </div>

                {brief.additionalDetails && (
                  <div>
                    <span className="text-xs text-neutral-400 block mb-1">Additional Notes</span>
                    <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {brief.additionalDetails}
                    </p>
                  </div>
                )}

                {brief.attachments && brief.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs text-neutral-400 block">
                      Uploaded Documents ({brief.attachments.length})
                    </span>
                    <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden bg-white">
                      {brief.attachments.map((att) => (
                        <div
                          key={att.fileId}
                          className="p-3 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="font-medium text-neutral-900 truncate">
                              {att.name}
                            </span>
                            <span className="text-neutral-400 text-[11px] shrink-0">
                              ({(att.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>

                          {att.downloadUrl && (
                            <a
                              href={att.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-700 hover:text-neutral-950 font-medium underline flex items-center gap-1 shrink-0 ml-2"
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
                  <Euro className="w-4 h-4 text-neutral-500" />
                  <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                    Indicative Budget
                  </h4>
                </div>
                <div className="text-xl font-serif font-bold text-neutral-950">
                  {brief.budget?.budgetType === 'unsure'
                    ? 'I am not sure'
                    : budgetRange?.label || '€2,000 – €3,500'}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Your budget range
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                    Project Timeline
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Preferred Start:</span>
                    <span className="font-medium text-neutral-800">
                      {brief.timeline?.preferredStart === 'specific_date' && brief.timeline.startDate
                        ? `Target: ${brief.timeline.startDate}`
                        : formatTimelineOption(brief.timeline?.preferredStart || 'asap')}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Desired Completion:</span>
                    <span className="font-medium text-neutral-800">
                      {brief.timeline?.desiredCompletion === 'specific_date' && brief.timeline.completionDate
                        ? `Deadline: ${brief.timeline.completionDate}`
                        : formatTimelineOption(brief.timeline?.desiredCompletion || 'flexible')}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Flexibility:</span>
                    <span className="font-medium text-neutral-800">
                      {formatTimelineOption(brief.timeline?.flexibility || 'somewhat_flexible')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Real Activity Timeline Card */}
            <Card className="p-6">
              <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-4">
                Activity History
              </h4>

              {activities.length === 0 ? (
                <p className="text-xs text-neutral-400">No activity recorded yet.</p>
              ) : (
                <div className="relative pl-4 border-l-2 border-neutral-100 space-y-4">
                  {activities.map((act) => (
                    <div key={act.id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-900 ring-4 ring-white" />
                      <div className="text-xs font-semibold text-neutral-900">
                        {formatActivityDisplay(act.title)}
                      </div>
                      {act.description && (
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {formatActivityDisplay(act.description)}
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-400 mt-1">
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
