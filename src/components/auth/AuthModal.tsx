import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UserCheck, Check, ChevronDown } from 'lucide-react';
import { AlongbyWordmark } from '../brand/AlongbyWordmark';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: 'client' | 'professional';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  initialRole = 'client',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'client' | 'professional'>(
    initialRole
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEvalAccounts, setShowEvalAccounts] = useState(false);

  const { refreshData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
      setError(null);
    }
  }, [isOpen, initialMode, initialRole]);

  // Reset error state on mode change
  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name or display name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const { profile } = await authService.registerUser(
          email,
          password,
          displayName.trim(),
          selectedRole
        );

        await refreshData();
        onClose();

        // Redirect to onboarding
        if (profile.role === 'client') {
          navigate('/onboarding/client');
        } else {
          navigate('/onboarding/professional');
        }
      } else {
        // Sign in
        const user = await authService.signIn(email, password);
        await refreshData();
        const profile = await authService.getUserProfile(user.uid);
        onClose();

        if (profile?.onboardingStatus === 'pending') {
          navigate(
            profile.role === 'client'
              ? '/onboarding/client'
              : '/onboarding/professional'
          );
        } else if (profile?.role === 'client') {
          navigate('/client');
        } else if (profile?.role === 'professional') {
          navigate('/professional');
        } else if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      let message = err.message || 'An error occurred during authentication.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo credentials filler for rapid evaluation
  const fillDemoAccount = (roleToFill: 'client' | 'professional' | 'admin') => {
    setMode('signin');
    setEmail(`demo.${roleToFill}@alongby.example`);
    setPassword('alongby123');
    setDisplayName(
      `Demo ${roleToFill.charAt(0).toUpperCase() + roleToFill.slice(1)}`
    );
    setSelectedRole(roleToFill === 'admin' ? 'client' : roleToFill);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign in' : 'Create your account'}
      description={
        mode === 'signin'
          ? 'Access your project briefs, curated shortlists, or specialist workspace.'
          : 'Register as a commissioning client or apply to join as an independent specialist.'
      }
      maxWidth="md"
    >
      {/* Subtle Brand Eyebrow */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-border)]">
        <AlongbyWordmark size="sm" className="text-[var(--color-text-primary)]" />
        <span className="text-xs text-[var(--color-text-muted)]">
          Curated Digital Practice
        </span>
      </div>

      {/* Mode Switcher */}
      <div
        role="tablist"
        aria-label="Authentication mode"
        className="flex rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-1 mb-5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => switchMode('signin')}
          className={`flex-1 py-2 text-[13px] rounded-[6px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            mode === 'signin'
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-[var(--shadow-card)]'
              : 'text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)]'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => switchMode('signup')}
          className={`flex-1 py-2 text-[13px] rounded-[6px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            mode === 'signup'
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-[var(--shadow-card)]'
              : 'text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)]'
          }`}
        >
          Create Account
        </button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            {/* Editorial Role Selection */}
            <fieldset>
              <legend className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
                Select account type
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={selectedRole === 'client'}
                  onClick={() => setSelectedRole('client')}
                  className={`p-3.5 rounded-[var(--radius-card)] border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    selectedRole === 'client'
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Briefcase
                      className="w-4 h-4 text-[var(--color-text-primary)]"
                      aria-hidden="true"
                    />
                    {selectedRole === 'client' && (
                      <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] inline-flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                    Client
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug">
                    Submit project briefs and compare curated shortlists
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={selectedRole === 'professional'}
                  onClick={() => setSelectedRole('professional')}
                  className={`p-3.5 rounded-[var(--radius-card)] border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    selectedRole === 'professional'
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <UserCheck
                      className="w-4 h-4 text-[var(--color-text-primary)]"
                      aria-hidden="true"
                    />
                    {selectedRole === 'professional' && (
                      <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-text)] inline-flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                    Professional
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug">
                    Receive matched briefs and submit commercial quotes
                  </div>
                </button>
              </div>
            </fieldset>

            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Eleanor Vance"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </>
        )}

        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          placeholder="name@organisation.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          placeholder="••••••••"
          helperText={
            mode === 'signup' ? 'Minimum 6 characters required.' : undefined
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          {mode === 'signin'
            ? 'Sign In'
            : `Continue as ${selectedRole === 'client' ? 'Client' : 'Professional'}`}
        </Button>
      </form>

      {/* Discreet Evaluation Account Switcher (preserves existing rapid evaluation helpers) */}
      <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
        <button
          type="button"
          aria-expanded={showEvalAccounts}
          onClick={() => setShowEvalAccounts((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <span className="font-medium">Evaluation &amp; Demo Credentials</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              showEvalAccounts ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {showEvalAccounts && (
          <div className="mt-2.5 p-3 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] tabular-nums">
              <span>Select role to prefill sign-in:</span>
              <span className="text-[var(--color-text-muted)]">pass: alongby123</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('client')}
                className="text-xs px-2.5 py-1.5 rounded-[6px] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                Prefill Client
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('professional')}
                className="text-xs px-2.5 py-1.5 rounded-[6px] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                Prefill Professional
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="text-xs px-2.5 py-1.5 rounded-[6px] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                Prefill Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
