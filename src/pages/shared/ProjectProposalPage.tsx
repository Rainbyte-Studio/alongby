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
import { Button } from '../../components/ui/Button';
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react';

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
      if (!prop && (proj.status === 'professional_selected' || proj.status === 'proposal_pending')) {
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
        requestedByName: userProfile.email || 'Participant',
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

  const getContractRoute = () => {
    if (userProfile?.role === 'professional') {
      return `/professional/projects/${projectId}/contract`;
    }
    if (userProfile?.role === 'admin') {
      return `/admin/projects/${projectId}/contract`;
    }
    return `/client/projects/${projectId}/contract`;
  };

  const getBackRoute = () => {
    if (userProfile?.role === 'professional') {
      return `/professional/opportunities`;
    }
    if (userProfile?.role === 'admin') {
      return `/admin/projects/${projectId}/shortlist`;
    }
    return `/client/projects/${projectId}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to={getBackRoute()}
            className="inline-flex items-center text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to {userProfile?.role === 'professional' ? 'Opportunities' : 'Project'}</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-neutral-500 mt-4">Loading commercial proposal...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to display proposal</p>
              <p className="mt-1 text-xs text-rose-700">{error}</p>
            </div>
          </div>
        ) : !proposal ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto" />
            <h3 className="text-lg font-semibold text-neutral-900">No Proposal Formulated Yet</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              A commercial proposal has not been generated for this project yet. Proposals are created
              once a specialist is selected from the verified shortlist.
            </p>
            {project?.status === 'professional_selected' && (
              <Button
                variant="primary"
                onClick={loadProposalData}
                className="mt-2"
              >
                Formulate Proposal v1
              </Button>
            )}
          </div>
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
