import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';

import { LandingPage } from './pages/LandingPage';
import { ClientOnboardingPage } from './pages/onboarding/ClientOnboardingPage';
import { ProfessionalOnboardingPage } from './pages/onboarding/ProfessionalOnboardingPage';
import { ClientDashboardPage } from './pages/client/ClientDashboardPage';
import { ClientProfilePage } from './pages/client/ClientProfilePage';
import { ClientProjectsPage } from './pages/client/ClientProjectsPage';
import { ProjectCreationPage } from './pages/client/ProjectCreationPage';
import { ProjectDetailPage } from './pages/client/ProjectDetailPage';
import { ProfessionalDashboardPage } from './pages/professional/ProfessionalDashboardPage';
import { ProfessionalProfilePage } from './pages/professional/ProfessionalProfilePage';
import { ProfessionalOpportunitiesPage } from './pages/professional/ProfessionalOpportunitiesPage';
import { ProfessionalOpportunityDetailPage } from './pages/professional/ProfessionalOpportunityDetailPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMatchingPage } from './pages/admin/AdminMatchingPage';
import { AdminShortlistPage } from './pages/admin/AdminShortlistPage';
import { ClientMatchesPage } from './pages/client/ClientMatchesPage';
import { ProjectProposalPage } from './pages/shared/ProjectProposalPage';
import { ProjectContractPage } from './pages/shared/ProjectContractPage';

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authRole, setAuthRole] = useState<'client' | 'professional'>('client');

  const handleOpenAuth = (
    mode: 'signin' | 'signup' = 'signin',
    role: 'client' | 'professional' = 'client'
  ) => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-[var(--color-primary-text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-[var(--radius-button)] focus:bg-[var(--color-primary)] focus:text-[var(--color-primary-text)] focus:text-xs focus:font-semibold focus:shadow-[var(--shadow-overlay)]"
      >
        Skip to main content
      </a>

      <Navbar onOpenAuth={handleOpenAuth} />

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage onOpenAuth={handleOpenAuth} />} />

          {/* Onboarding Routes */}
          <Route
            path="/onboarding/client"
            element={
              <ProtectedRoute requireCompletedOnboarding={false}>
                <ClientOnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/professional"
            element={
              <ProtectedRoute requireCompletedOnboarding={false}>
                <ProfessionalOnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Client Protected Routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ClientDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ClientProfilePage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ClientProjectsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/new"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ProjectCreationPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/:projectId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ProjectDetailPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/:projectId/matches"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ClientMatchesPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/:projectId/edit"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ProjectCreationPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/:projectId/proposal"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ProjectProposalPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/projects/:projectId/contract"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['client', 'admin']}>
                  <ProjectContractPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Professional Protected Routes */}
          <Route
            path="/professional"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['professional', 'admin']}>
                  <ProfessionalDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professional/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['professional', 'admin']}>
                  <ProfessionalProfilePage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professional/opportunities"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['professional', 'admin']}>
                  <ProfessionalOpportunitiesPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professional/opportunities/:opportunityId"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['professional', 'admin']}>
                  <ProfessionalOpportunityDetailPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professional/projects/:projectId/proposal"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['professional', 'admin']}>
                  <ProjectProposalPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professional/projects/:projectId/contract"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['professional', 'admin']}>
                  <ProjectContractPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects/:projectId/proposal"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <ProjectProposalPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects/:projectId/contract"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <ProjectContractPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects/:projectId/matching"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <AdminMatchingPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects/:projectId/shortlist"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <AdminShortlistPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer onOpenAuth={handleOpenAuth} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
