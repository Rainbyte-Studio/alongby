import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  { number: '01', title: 'Share your brief', description: 'Outline your goals, deliverables, budget and timeline in a guided brief. Save a draft and return when you are ready.' },
  { number: '02', title: 'Meet your shortlist', description: 'After your brief is reviewed, relevant professionals can respond with tailored quotes. Compare a focused shortlist before deciding.' },
  { number: '03', title: 'Move forward clearly', description: 'Choose a professional, review a detailed proposal and confirm the contract. Each step stays connected to your project.' },
] as const;

const DISCIPLINES = ['Websites', 'E-commerce', 'Web & mobile apps', 'UI/UX design', 'Brand identity', 'Digital growth'] as const;

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
              Alongby helps businesses find the right digital and creative professionals. Share your project, compare a curated shortlist and agree on the details in one organised workspace.
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
            A clearer way to get your project moving.
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
          <Link to="/how-it-works" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-70">Explore the full process <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>
      </section>

      {/* Distinct audiences with short, useful value propositions. */}
      <section id="for-clients" className="scroll-mt-20 bg-[var(--color-surface)] border-y border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">02 / For clients</p>
            <h2 className="typo-page-title max-w-2xl text-[var(--color-text-primary)] mb-5">
              Choose a professional with confidence.
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
              Tell us about your project once. Review suitable specialists, compare their experience and quotes, then move towards a clear proposal without sorting through endless pitches.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end flex flex-col items-start gap-4">
            <Button variant="primary" size="lg" onClick={handleClientEntry} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {clientCtaLabel}
            </Button>
            <Link to="/for-clients" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-70">Explore the client experience <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section id="for-professionals" className="scroll-mt-20 bg-[var(--color-surface-secondary)] px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">03 / For professionals</p>
            <h2 className="typo-page-title max-w-2xl text-[var(--color-text-primary)] mb-5">
              Spend less time pitching. More time doing your best work.
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
              Build a profile around your expertise and availability. Receive relevant project invitations, review the requirements and send a quote when the opportunity fits.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end flex flex-col items-start gap-4">
            <Button variant="outline" size="lg" onClick={handleProfessionalEntry} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {professionalCtaLabel}
            </Button>
            <Link to="/for-professionals" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-70">Explore the professional experience <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
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
            Good work begins with the right fit and honest expectations. Alongby brings private project briefs, thoughtful matching, clear commercial terms and documented decisions into one place.
          </p>
          <Link to="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-70">Our approach and principles <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section id="transparency" className="border-t border-[var(--color-border)] bg-[var(--color-bg-app)] px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">05 / Clear agreements</p>
            <h2 className="typo-section-heading text-[var(--color-text-primary)] mb-3">Know what you are agreeing to.</h2>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)]">Quotes are a starting point. Before work begins, deliverables, milestones and commercial terms are set out in a proposal and accepted contract.</p>
          </div>
          <Link to="/how-it-works#agreements" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] underline underline-offset-4 hover:opacity-70">How agreements work <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
};
