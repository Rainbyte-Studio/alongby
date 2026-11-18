import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { profileService } from '../../services/profileService';
import { auditService } from '../../services/auditService';
import { projectService } from '../../services/projectService';
import { taxonomyService } from '../../services/taxonomyService';
import { ProfessionalProfile, VerificationStatus, Project } from '../../types';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  ArrowRight,
  Euro,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser, userProfile, refreshData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'professionals' | 'projects' | 'audit'>('professionals');
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const list = await profileService.getAllProfessionals();
      setProfessionals(list);
    } catch (err) {
      console.error('Failed to load professionals for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load projects for admin:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
    fetchProjects();
  }, []);

  const handleUpdateStatus = async (userId: string, status: VerificationStatus) => {
    if (!currentUser) return;
    setActionLoadingId(userId);
    try {
      await profileService.updateVerificationStatus(userId, status);
      await auditService.logEvent(
        currentUser.uid,
        'admin',
        'professional_verification_updated',
        'professionalProfile',
        userId,
        { newStatus: status }
      );
      await fetchProfessionals();
      await refreshData();
    } catch (err) {
      console.error('Admin status update failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success">Verified</Badge>;
      case 'under_review':
      case 'submitted':
        return <Badge variant="warning">Under Review</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      title="Platform Administration"
      subtitle="Curate matching queues, review and verify professional applications, and inspect audit activity."
    >
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          { id: 'professionals', label: 'Professionals & Verification', badge: professionals.length },
          {
            id: 'projects',
            label: 'Project Matching Queue',
            badge: projects.filter(
              (p) =>
                p.status === 'submitted' ||
                p.status === 'matching' ||
                p.status === 'awaiting_professional_responses'
            ).length,
          },
          { id: 'audit', label: 'Security & Access' },
        ]}
      />

      {/* PROFESSIONALS TAB */}
      {activeTab === 'professionals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Professional Verification Registry
              </h3>
              <p className="text-xs text-neutral-500">
                Only verified professionals are eligible for algorithmic and curated matching scoring.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProfessionals}>
              Refresh Registry
            </Button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading registered professionals..." />
          ) : professionals.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No professionals in registry"
              description="When practitioners complete the professional onboarding process, their profiles will appear here for review and verification."
            />
          ) : (
            <div className="space-y-4">
              {professionals.map((prof) => (
                <Card key={prof.userId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-neutral-900 text-sm">
                        {prof.displayName}
                      </span>
                      {getStatusBadge(prof.verificationStatus)}
                      <span className="text-xs text-neutral-400">
                        {prof.yearsOfExperience}y exp
                      </span>
                    </div>

                    <div className="text-xs font-medium text-neutral-700">
                      {prof.professionalTitle}
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {prof.shortBio}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {prof.primaryServices?.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center gap-3 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {prof.country} ({prof.timezone})
                      </span>
                      <span>•</span>
                      <span>Floor: €{(prof.minimumBudgetMinor / 100).toLocaleString()} EUR</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                    {prof.verificationStatus !== 'verified' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoadingId === prof.userId}
                        onClick={() => handleUpdateStatus(prof.userId, 'verified')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Verify Professional
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={actionLoadingId === prof.userId}
                        onClick={() => handleUpdateStatus(prof.userId, 'under_review')}
                        leftIcon={<Clock className="w-3.5 h-3.5" />}
                      >
                        Set Under Review
                      </Button>
                    )}

                    {prof.verificationStatus !== 'rejected' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={actionLoadingId === prof.userId}
                        onClick={() => handleUpdateStatus(prof.userId, 'rejected')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MATCHING QUEUE TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Curated Matching Queue
              </h3>
              <p className="text-xs text-neutral-500">
                Client project briefs submitted for algorithmic scoring and professional opportunity curation.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProjects} isLoading={projectsLoading}>
              Refresh Projects
            </Button>
          </div>

          {projectsLoading ? (
            <LoadingSpinner label="Loading project briefs..." />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Matching Queue Empty"
              description="No client project briefs have been created yet. When clients submit project briefs, they will appear here for matching and opportunity dispatch."
            />
          ) : (
            <div className="space-y-4">
              {projects.map((proj) => {
                const service = taxonomyService.getServiceCategoryById(proj.serviceId);
                const isMatchingStage =
                  proj.status === 'submitted' ||
                  proj.status === 'matching' ||
                  proj.status === 'awaiting_professional_responses';

                return (
                  <Card
                    key={proj.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-neutral-900 text-sm">
                          {proj.title}
                        </span>
                        <Badge
                          variant={
                            proj.status === 'submitted'
                              ? 'warning'
                              : proj.status === 'matching'
                              ? 'info'
                              : proj.status === 'awaiting_professional_responses'
                              ? 'info'
                              : proj.status === 'draft'
                              ? 'neutral'
                              : 'success'
                          }
                        >
                          {proj.status.replace(/_/g, ' ')}
                        </Badge>
                        {service && (
                          <span className="text-xs text-neutral-500 font-medium">
                            • {service.name}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-600">
                        Client: <strong className="text-neutral-800">{proj.clientName || 'Client'}</strong>
                        {proj.clientCompanyName ? ` (${proj.clientCompanyName})` : ''}
                      </div>

                      <p className="text-xs text-neutral-500 line-clamp-2">
                        {proj.brief.description || 'No description provided.'}
                      </p>

                      <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-3 pt-1">
                        <span className="flex items-center gap-1">
                          <Euro className="w-3 h-3 text-neutral-400" />
                          {proj.brief.budget.budgetType === 'unsure' ? (
                            'Unspecified budget'
                          ) : (
                            `€${((proj.brief.budget.minAmountMinor || 0) / 100).toLocaleString()} – €${((proj.brief.budget.maxAmountMinor || 0) / 100).toLocaleString()}`
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          Start: {proj.brief.timeline.preferredStart.replace(/_/g, ' ')}
                        </span>
                        <span>•</span>
                        <span>
                          Updated: {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-100">
                      {isMatchingStage ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/admin/projects/${proj.id}/matching`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Review Matching & Candidates
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/projects/${proj.id}/matching`)}
                        >
                          Inspect Matches
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'audit' && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-neutral-900">
                Security & Administrative Enforcement
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mb-4">
              Alongby protects administrative privileges through backend Firestore Security Rules. Role definitions are verified against authenticated user profiles stored in <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">users/&#123;uid&#125;</code>.
            </p>

            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-2">
              <div className="font-semibold text-neutral-800">Active Security Controls:</div>
              <ul className="list-disc list-inside text-neutral-600 space-y-1">
                <li>Non-admin clients cannot modify user roles or account statuses</li>
                <li>Professionals cannot self-verify into the curated pool</li>
                <li>Direct URL navigation is blocked by client-side and server-side rules</li>
                <li>Audit logging is enabled for all critical lifecycle mutations</li>
              </ul>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};
