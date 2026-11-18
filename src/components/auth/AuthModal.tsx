import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UserCheck, Sparkles, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';
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
      <div className="flex justify-center pb-2 mb-6 border-b border-neutral-100">
        <AlongbyWordmark size="lg" className="text-neutral-950" />
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-md bg-neutral-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => switchMode('signin')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            mode === 'signin'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Create Account
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                I am joining as a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedRole === 'client'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-900'
                  }`}
                >
                  <Briefcase className={`w-4 h-4 mb-2 ${selectedRole === 'client' ? 'text-white' : 'text-neutral-600'}`} />
                  <div className="text-xs font-semibold">Client</div>
                  <div className={`text-[11px] mt-0.5 ${selectedRole === 'client' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    I want to hire curated talent
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('professional')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedRole === 'professional'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-900'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mb-2 ${selectedRole === 'professional' ? 'text-white' : 'text-neutral-600'}`} />
                  <div className="text-xs font-semibold">Professional</div>
                  <div className={`text-[11px] mt-0.5 ${selectedRole === 'professional' ? 'text-neutral-300' : 'text-neutral-500'}`}>
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
      <div className="mt-6 pt-4 border-t border-neutral-100">
        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-neutral-700">Quick Evaluation Helpers:</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">dev pass: alongby123</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoAccount('client')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors font-medium cursor-pointer"
          >
            Prefill Client
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('professional')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors font-medium cursor-pointer"
          >
            Prefill Professional
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors font-medium cursor-pointer"
          >
            Prefill Admin
          </button>
        </div>
      </div>
    </Modal>
  );
};
