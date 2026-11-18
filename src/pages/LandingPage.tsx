import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (
    mode?: 'signin' | 'signup',
    role?: 'client' | 'professional'
  ) => void;
}

const PROCESS_STEPS = [
  { number: '01', title: 'Share your brief', description: 'Tell us what you need and what matters most.' },
  { number: '02', title: 'Meet your shortlist', description: 'Compare a small selection of matched professionals and their quotes.' },
  { number: '03', title: 'Move forward clearly', description: 'Agree on scope, milestones and terms before work begins.' },
] as const;

const DISCIPLINES = ['Websites', 'E-commerce', 'Applications', 'UI/UX', 'Branding', 'Digital Marketing'] as const;

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleClientEntry = () => {
    if (currentUser && userProfile) {
      if (userProfile.onboardingStatus === 'pending') {
        navigate(
          userProfile.role === 'client'
            ? '/onboarding/client'
            : '/onboarding/professional'
        );
        return;
      }
      if (userProfile.role === 'client') {
        navigate('/client/projects/new');
        return;
      }
      if (userProfile.role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate('/professional');
      return;
    }
    onOpenAuth('signup', 'client');
  };

  const handleProfessionalEntry = () => {
    if (currentUser && userProfile) {
      if (userProfile.onboardingStatus === 'pending') {
        navigate(
          userProfile.role === 'professional'
            ? '/onboarding/professional'
            : '/onboarding/client'
        );
        return;
      }
      if (userProfile.role === 'professional') {
        navigate('/professional');
        return;
      }
      if (userProfile.role === 'admin') {
        navigate('/admin');
        return;
      }
      navigate('/client');
      return;
    }
    onOpenAuth('signup', 'professional');
  };

  const clientCtaLabel =
    currentUser && userProfile?.role === 'client'
      ? userProfile.onboardingStatus === 'pending'
        ? 'Complete Client Onboarding'
        : 'Create a Project Brief'
      : 'Start a Project';

  const professionalCtaLabel =
    currentUser && userProfile?.role === 'professional'
      ? userProfile.onboardingStatus === 'pending'
        ? 'Complete Professional Profile'
        : 'Open Professional Workspace'
      : 'Join as a Professional';

  return (
    <div className="flex flex-col min-w-0 bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      {/* A focused first impression: message, explanation and two clear paths. */}
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] mb-6">
              A curated creative marketplace
            </p>
            <h1 className="typo-hero max-w-3xl text-[var(--color-text-primary)] mb-6">
              The right people. Better projects.
            </h1>
            <p className="font-sans text-base sm:text-lg text-[var(--color-text-secondary)] max-w-xl leading-relaxed mb-9">
              Connect with carefully selected digital and creative professionals, from brief to agreement.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <Button variant="primary" size="lg" onClick={handleClientEntry} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {clientCtaLabel}
              </Button>
              <Button variant="outline" size="lg" onClick={handleProfessionalEntry}>
                {professionalCtaLabel}
              </Button>
            </div>
            {!currentUser && (
              <p className="mt-5 text-xs text-[var(--color-text-muted)]">
                Already a member?{' '}
                <button type="button" onClick={() => onOpenAuth('signin')}
                  className="font-medium text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-80 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
                  Sign in
                </button>
              </p>
            )}
          </div>
          <div className="mt-20 sm:mt-28 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Expertise across</span>
            {DISCIPLINES.map((discipline) => (
              <span key={discipline} className="text-xs text-[var(--color-text-secondary)]">{discipline}</span>
            ))}
          </div>
        </div>
      </section>

      {/* One process, rather than two lengthy parallel instruction manuals. */}
      <section id="how-it-works" className="scroll-mt-20 bg-[var(--color-bg-app)] px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">01 / How it works</p>
          <h2 className="typo-page-title text-[var(--color-text-primary)] max-w-2xl mb-12 sm:mb-16">
            From idea to collaboration, without the noise.
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {PROCESS_STEPS.map((step) => (
              <li key={step.number} className="border-t border-[var(--color-border-strong)] pt-5">
                <span className="font-serif text-lg text-[var(--color-text-muted)]">{step.number}</span>
                <h3 className="typo-card-title text-[var(--color-text-primary)] mt-6 mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Distinct audiences with short, useful value propositions. */}
      <section id="for-clients" className="scroll-mt-20 bg-[var(--color-surface)] border-y border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">02 / For clients</p>
            <h2 className="typo-page-title max-w-2xl text-[var(--color-text-primary)] mb-5">
              Find the right fit, not the biggest list.
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
              A clear brief. A focused shortlist. The confidence to choose who brings your project to life.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Button variant="primary" size="lg" onClick={handleClientEntry} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {clientCtaLabel}
            </Button>
          </div>
        </div>
      </section>

      <section id="for-professionals" className="scroll-mt-20 bg-[var(--color-surface-secondary)] px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">03 / For professionals</p>
            <h2 className="typo-page-title max-w-2xl text-[var(--color-text-primary)] mb-5">
              Better briefs. More meaningful opportunities.
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
              Discover considered projects that match your expertise, availability and approach.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Button variant="outline" size="lg" onClick={handleProfessionalEntry} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {professionalCtaLabel}
            </Button>
          </div>
        </div>
      </section>

      <section id="principles" className="scroll-mt-20 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-5">04 / Our philosophy</p>
          <h2 className="typo-page-title max-w-4xl text-[var(--color-text-primary)]">
            Less searching. More thoughtful collaboration.
          </h2>
          <p className="mt-6 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
            Private matching, clear expectations and a considered path from introduction to agreement.
          </p>
        </div>
      </section>
    </div>
  );
};
