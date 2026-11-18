import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { proposalService } from '../../services/proposalService';
import { contractService } from '../../services/contractService';
import { Project, Contract } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ContractDocumentView } from '../../components/contract/ContractDocumentView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';

export const ProjectContractPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContractData = async () => {
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
        setError('You do not have authorization to view this contract.');
        return;
      }

      setProject(proj);

      let cont = await contractService.getContractByProject(projectId);

      // If no contract found, but proposal exists and is accepted, generate it!
      if (!cont) {
        const prop = await proposalService.getProposalByProject(projectId);
        if (prop && prop.status === 'accepted') {
          try {
            cont = await contractService.generateContractFromAcceptedProposal(prop.id, userProfile.id);
          } catch (genErr: any) {
            console.warn('Could not auto-generate contract:', genErr);
          }
        }
      }

      setContract(cont);
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message || 'Failed to load Master Services Contract.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractData();
  }, [projectId, userProfile?.id]);

  const handleExecuteSignature = async (typedSignature: string) => {
    if (!contract || !userProfile?.id) return;
    try {
      setIsSigning(true);
      const role = userProfile.role as 'client' | 'professional' | 'admin';
      const effectiveRole = role === 'admin' ? 'client' : role;

      const updated = await contractService.executeSignature(
        contract.id,
        effectiveRole,
        userProfile.id,
        {
          typedSignature,
          acceptedTerms: true,
        }
      );

      setContract(updated);
    } finally {
      setIsSigning(false);
    }
  };

  const getProposalRoute = () => {
    if (userProfile?.role === 'professional') {
      return `/professional/projects/${projectId}/proposal`;
    }
    if (userProfile?.role === 'admin') {
      return `/admin/projects/${projectId}/proposal`;
    }
    return `/client/projects/${projectId}/proposal`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to={getProposalRoute()}
            className="inline-flex items-center text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Back to Commercial Proposal</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-[var(--color-text-secondary)] mt-4">Loading contract and e-signature status...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-[var(--radius-card)] text-[var(--color-error-text)] text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to display contract</p>
              <p className="mt-1 text-[13px] opacity-90">{error}</p>
            </div>
          </div>
        ) : !contract ? (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-12 text-center space-y-4">
            <FileCheck className="w-12 h-12 text-[var(--color-text-muted)] mx-auto" />
            <h3 className="typo-section-heading text-[var(--color-text-primary)]">Contract Not Generated Yet</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
              The Master Services Agreement is generated once both Client and Specialist formally accept
              the commercial proposal.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(getProposalRoute())}
              className="mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Proposal Review
            </Button>
          </div>
        ) : (
          <ContractDocumentView
            contract={contract}
            userRole={userProfile!.role}
            userId={userProfile!.id}
            onExecuteSignature={handleExecuteSignature}
            isSigning={isSigning}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
