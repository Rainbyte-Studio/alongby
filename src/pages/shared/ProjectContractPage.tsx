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
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, FileCheck } from 'lucide-react';

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
            cont = await contractService.generateContractFromAcceptedProposal(
              prop.id,
              userProfile.id
            );
          } catch (genErr: any) {
            console.warn('Could not auto-generate contract:', genErr);
          }
        }
      }

      setContract(cont);
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message || 'Failed to load Master Services Agreement.');
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

  const role = userProfile?.role || 'client';

  const getProposalRoute = () => {
    if (role === 'professional') {
      return `/professional/projects/${projectId}/proposal`;
    }
    if (role === 'admin') {
      return `/admin/projects/${projectId}/proposal`;
    }
    return `/client/projects/${projectId}/proposal`;
  };

  const breadcrumbs =
    role === 'professional'
      ? [
          { label: 'Workspace', to: '/professional' },
          { label: 'Proposal', to: getProposalRoute() },
          { label: 'Service Agreement' },
        ]
      : role === 'admin'
      ? [
          { label: 'Admin Console', to: '/admin' },
          { label: 'Proposal', to: getProposalRoute() },
          { label: 'Service Agreement' },
        ]
      : [
          { label: 'Workspace', to: '/client' },
          { label: project?.title || 'Project', to: `/client/projects/${projectId}` },
          { label: 'Proposal', to: getProposalRoute() },
          { label: 'Service Agreement' },
        ];

  return (
    <DashboardLayout
      role={role}
      breadcrumbs={breadcrumbs}
      action={
        <Link to={getProposalRoute()} className="print:hidden">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Commercial Proposal
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" label="Loading service agreement…" />
          </div>
        ) : error ? (
          <Alert variant="error" title="Unable to display service agreement">
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadContractData}>
                Retry
              </Button>
            </div>
          </Alert>
        ) : !contract ? (
          <EmptyState
            icon={FileCheck}
            title="Agreement Not Generated Yet"
            description="The Master Services Agreement is generated automatically once both Client and Specialist accept the commercial proposal."
            action={{
              label: 'Review Commercial Proposal',
              onClick: () => navigate(getProposalRoute()),
              variant: 'primary',
            }}
          />
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
