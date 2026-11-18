import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { proposalService } from '../../services/proposalService';
import { contractService } from '../../services/contractService';
import { Project, Proposal, ChangeRequestCategory } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ProposalReviewView } from '../../components/proposal/ProposalReviewView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, FileText } from 'lucide-react';

export const ProjectProposalPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [isPublishingRevision, setIsPublishingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProposalData = async () => {
    if (!projectId || !userProfile?.id) return;

    try {
      setLoading(true);
      setError(null);
      const proj = await projectService.getProject(projectId);
      if (!proj) {
        setError('Project not found.');
        return;
      }

      // Authorization check: Client owner, selected professional, or admin
      const isClient = proj.clientId === userProfile.id;
      const isPro = proj.selectedProfessionalId === userProfile.id;
      const isAdmin = userProfile.role === 'admin';

      if (!isClient && !isPro && !isAdmin) {
        setError('You do not have authorization to view this proposal.');
        return;
      }

      setProject(proj);

      let prop = await proposalService.getProposalByProject(projectId);

      // Auto-initialize Proposal v1 if professional is selected but proposal doc isn't created yet
      if (
        !prop &&
        (proj.status === 'professional_selected' || proj.status === 'proposal_pending')
      ) {
        try {
          prop = await proposalService.initializeProposalFromSelection(projectId, userProfile.id);
        } catch (initErr: any) {
          console.warn('Could not auto-initialize proposal:', initErr);
        }
      }

      setProposal(prop);
    } catch (err: any) {
      console.error('Error loading proposal:', err);
      setError(err.message || 'Failed to load commercial proposal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposalData();
  }, [projectId, userProfile?.id]);

  const handleAcceptProposal = async (typedName: string) => {
    if (!proposal || !userProfile?.id) return;
    try {
      setIsAccepting(true);
      const role = userProfile.role as 'client' | 'professional' | 'admin';
      const effectiveRole = role === 'admin' ? 'client' : role;

      const { proposal: updated, bothAccepted } = await proposalService.acceptProposal(
        proposal.id,
        effectiveRole,
        userProfile.id,
        { typedName }
      );

      setProposal(updated);

      // If both accepted, generate contract immediately
      if (bothAccepted) {
        try {
          await contractService.generateContractFromAcceptedProposal(proposal.id, userProfile.id);
        } catch (cErr) {
          console.warn('Contract pre-generation notice:', cErr);
        }
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSubmitChangeRequest = async (params: {
    category: ChangeRequestCategory;
    message: string;
    suggestedChanges?: { field: string; requestedValue: string; reason?: string }[];
  }) => {
    if (!proposal || !userProfile?.id || !project) return;
    try {
      setIsSubmittingChange(true);
      await proposalService.submitChangeRequest(proposal.id, {
        projectId: project.id,
        requestedBy: userProfile.id,
        requestedByRole: userProfile.role,
        requestedByName: userProfile.displayName || userProfile.email || 'Participant',
        category: params.category,
        message: params.message,
        suggestedChanges: params.suggestedChanges,
      });

      const refreshed = await proposalService.getProposal(proposal.id);
      if (refreshed) setProposal(refreshed);
    } finally {
      setIsSubmittingChange(false);
    }
  };

  const handlePublishRevisedProposal = async (modifications: Partial<Proposal>) => {
    if (!proposal || !userProfile?.id || !project) return;
    try {
      setIsPublishingRevision(true);
      const revised = await proposalService.createRevisedVersion(
        proposal.id,
        modifications,
        userProfile.id
      );
      setProposal(revised);
    } finally {
      setIsPublishingRevision(false);
    }
  };

  const role = userProfile?.role || 'client';

  const getContractRoute = () => {
    if (role === 'professional') {
      return `/professional/projects/${projectId}/contract`;
    }
    if (role === 'admin') {
      return `/admin/projects/${projectId}/contract`;
    }
    return `/client/projects/${projectId}/contract`;
  };

  const getBackRoute = () => {
    if (role === 'professional') {
      return `/professional/opportunities`;
    }
    if (role === 'admin') {
      return `/admin/projects/${projectId}/shortlist`;
    }
    return `/client/projects/${projectId}`;
  };

  const breadcrumbs =
    role === 'professional'
      ? [
          { label: 'Workspace', to: '/professional' },
          { label: 'Opportunities', to: '/professional/opportunities' },
          { label: project?.title || 'Commercial Proposal' },
        ]
      : role === 'admin'
      ? [
          { label: 'Admin Console', to: '/admin' },
          { label: project?.title || 'Project', to: `/admin/projects/${projectId}/shortlist` },
          { label: 'Commercial Proposal' },
        ]
      : [
          { label: 'Workspace', to: '/client' },
          { label: 'Projects', to: '/client/projects' },
          { label: project?.title || 'Project', to: `/client/projects/${projectId}` },
          { label: 'Commercial Proposal' },
        ];

  return (
    <DashboardLayout
      role={role}
      breadcrumbs={breadcrumbs}
      action={
        <Link to={getBackRoute()}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            {role === 'professional' ? 'Opportunities' : 'Project Overview'}
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" label="Loading commercial proposal…" />
          </div>
        ) : error ? (
          <Alert variant="error" title="Unable to display proposal">
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadProposalData}>
                Retry
              </Button>
            </div>
          </Alert>
        ) : !proposal ? (
          <EmptyState
            icon={FileText}
            title="No Proposal Formulated Yet"
            description="A commercial proposal is created once a specialist is selected from the curated shortlist."
            action={
              project?.status === 'professional_selected'
                ? {
                    label: 'Formulate Proposal v1',
                    onClick: loadProposalData,
                    variant: 'primary',
                  }
                : {
                    label: 'Return to Project',
                    onClick: () => navigate(getBackRoute()),
                  }
            }
          />
        ) : (
          <ProposalReviewView
            proposal={proposal}
            userRole={userProfile!.role}
            userId={userProfile!.id}
            onAcceptProposal={handleAcceptProposal}
            onSubmitChangeRequest={handleSubmitChangeRequest}
            onPublishRevisedProposal={handlePublishRevisedProposal}
            onNavigateToContract={() => navigate(getContractRoute())}
            isAccepting={isAccepting}
            isSubmittingChange={isSubmittingChange}
            isPublishingRevision={isPublishingRevision}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
