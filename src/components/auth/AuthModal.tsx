import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UserCheck, Sparkles, AlertCircle } from 'lucide-react';
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
  const [selectedRole, setSelectedRole] = useState<'client' | 'professional'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { refreshData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
      setError(null);
    }
  }, [isOpen, initialMode, initialRole]);

  // Reset state on mode change
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
          navigate(profile.role === 'client' ? '/onboarding/client' : '/onboarding/professional');
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
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
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
    setDisplayName(`Demo ${roleToFill.charAt(0).toUpperCase() + roleToFill.slice(1)}`);
    setSelectedRole(roleToFill === 'admin' ? 'client' : roleToFill);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign in to alongby' : 'Create your alongby account'}
      description={
        mode === 'signin'
          ? 'Enter your email and password to access your projects or workspace.'
          : 'Join the curated network for high-calibre digital and creative projects.'
      }
      maxWidth="md"
    >
      {/* Brand Wordmark Header */}
      <div className="flex justify-center pb-3 mb-6 border-b border-[var(--color-border)]">
        <AlongbyWordmark size="lg" className="text-[var(--color-text-primary)]" />
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] p-1 mb-6">
        <button
          type="button"
          onClick={() => switchMode('signin')}
          className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            mode === 'signin'
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-[var(--shadow-card)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            mode === 'signup'
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-[var(--shadow-card)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Create Account
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-button)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-xs text-[var(--color-error-text)] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-error)]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            {/* Role Selection */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
                I am joining as a
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`p-3.5 rounded-[var(--radius-button)] border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    selectedRole === 'client'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <Briefcase className={`w-4 h-4 mb-2 ${selectedRole === 'client' ? 'text-white' : 'text-[var(--color-text-secondary)]'}`} />
                  <div className="text-[13px] font-semibold">Client</div>
                  <div className={`text-xs mt-0.5 leading-snug ${selectedRole === 'client' ? 'text-neutral-300' : 'text-[var(--color-text-secondary)]'}`}>
                    I want to hire curated talent
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('professional')}
                  className={`p-3.5 rounded-[var(--radius-button)] border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    selectedRole === 'professional'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mb-2 ${selectedRole === 'professional' ? 'text-white' : 'text-[var(--color-text-secondary)]'}`} />
                  <div className="text-[13px] font-semibold">Professional</div>
                  <div className={`text-xs mt-0.5 leading-snug ${selectedRole === 'professional' ? 'text-neutral-300' : 'text-[var(--color-text-secondary)]'}`}>
                    I offer design / dev services
                  </div>
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
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
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          placeholder="••••••••"
          helperText={mode === 'signup' ? 'Must be at least 6 characters' : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          {mode === 'signin' ? 'Sign In' : `Create ${selectedRole === 'client' ? 'Client' : 'Professional'} Account`}
        </Button>
      </form>

      {/* Quick Testing Helper */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)] mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span className="font-semibold text-[var(--color-text-primary)]">Quick Evaluation Helpers:</span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] tabular-nums">dev pass: alongby123</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoAccount('client')}
            className="text-xs px-2.5 py-1.5 rounded-md bg-[var(--color-surface-secondary)] hover:bg-[#E7E3DD] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors font-medium cursor-pointer"
          >
            Prefill Client
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('professional')}
            className="text-xs px-2.5 py-1.5 rounded-md bg-[var(--color-surface-secondary)] hover:bg-[#E7E3DD] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors font-medium cursor-pointer"
          >
            Prefill Professional
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="text-xs px-2.5 py-1.5 rounded-md bg-[var(--color-surface-secondary)] hover:bg-[#E7E3DD] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-colors font-medium cursor-pointer"
          >
            Prefill Admin
          </button>
        </div>
      </div>
    </Modal>
  );
};
