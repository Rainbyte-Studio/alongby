import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService, defaultEmptyBrief } from '../../services/projectService';
import { Project, ProjectBrief } from '../../types';
import { BriefStepper, BRIEF_STEPS } from '../../components/brief/BriefStepper';
import { StepService } from '../../components/brief/StepService';
import { StepProjectType } from '../../components/brief/StepProjectType';
import { StepProjectDetails } from '../../components/brief/StepProjectDetails';
import { StepFeatures } from '../../components/brief/StepFeatures';
import { StepAssets } from '../../components/brief/StepAssets';
import { StepTimeline } from '../../components/brief/StepTimeline';
import { StepBudget } from '../../components/brief/StepBudget';
import { StepAdditional } from '../../components/brief/StepAdditional';
import { StepReview } from '../../components/brief/StepReview';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ArrowLeft, ArrowRight, Save, AlertCircle } from 'lucide-react';

export const ProjectCreationPage: React.FC = () => {
  const { userProfile, clientProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<ProjectBrief>(defaultEmptyBrief);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeSavePromiseRef = useRef<Promise<void> | null>(null);
  const isSavingAndExitingRef = useRef<boolean>(false);
  const latestBriefRef = useRef<ProjectBrief>(defaultEmptyBrief);
  const latestStepRef = useRef<number>(1);
  const latestCompletedStepsRef = useRef<number[]>([1]);

  // Session-level stable draft references to prevent duplicate draft creation
  const currentDraftIdRef = useRef<string | null>(null);
  const initDraftPromiseRef = useRef<Promise<Project | null> | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Initialize or load draft
  useEffect(() => {
    if (authLoading || !userProfile?.id) return;

    let targetId = routeProjectId || searchParams.get('draftId');

    // If no targetId in URL, use the stable draft ID already established for this session,
    // or generate a new stable projectId synchronously and bind it to the URL immediately.
    if (!targetId) {
      if (currentDraftIdRef.current) {
        targetId = currentDraftIdRef.current;
      } else {
        targetId = projectService.generateProjectId();
        currentDraftIdRef.current = targetId;
      }
      setSearchParams({ draftId: targetId }, { replace: true });
    } else {
      currentDraftIdRef.current = targetId;
    }

    const stableTargetId = targetId;

    // Idempotency: If this exact draft is already loaded or being loaded, do not re-trigger
    if (initDraftPromiseRef.current) {
      return;
    }

    async function initProject(): Promise<Project | null> {
      try {
        setLoading(true);

        const realProfileCompanyName = clientProfile?.companyName?.trim() || '';
        const initialBrief: ProjectBrief = {
          ...defaultEmptyBrief,
          title: '',
          businessName: realProfileCompanyName,
        };

        const loadedProject = await projectService.getOrCreateDraft(
          stableTargetId,
          userProfile!.id,
          clientProfile?.fullName || userProfile!.displayName,
          realProfileCompanyName || undefined,
          initialBrief
        );

        if (!loadedProject) {
          console.error('Failed to load or create draft project');
          return null;
        }

        // If project belongs to someone else
        if (loadedProject.clientId !== userProfile!.id) {
          navigate('/client', { replace: true });
          return null;
        }

        // If project is already submitted
        if (loadedProject.status !== 'draft') {
          navigate(`/client/projects/${loadedProject.id}`, { replace: true });
          return null;
        }

        setProjectId(loadedProject.id);
        setProject(loadedProject);

        // Sanitize title (ensure no test fixture)
        const rawTitle = loadedProject.brief?.title || loadedProject.title || '';
        const sanitizedTitle = rawTitle === 'Submitted Brief to Protect' ? '' : rawTitle;

        // Clean any legacy demo company if it was prefilled previously
        let rawBusinessName = loadedProject.brief?.businessName || '';
        if (
          (rawBusinessName === 'Apex Studio & Co' || rawBusinessName === 'Client Corp') &&
          realProfileCompanyName !== rawBusinessName
        ) {
          rawBusinessName = realProfileCompanyName;
        }

        const loadedBrief: ProjectBrief = {
          ...loadedProject.brief,
          title: sanitizedTitle,
          businessName: rawBusinessName,
        };
        const loadedStep = loadedProject.currentStep || 1;
        const loadedCompleted = loadedProject.draftCompletedSteps || [1];

        setBrief(loadedBrief);
        latestBriefRef.current = loadedBrief;
        setCurrentStep(loadedStep);
        latestStepRef.current = loadedStep;
        setCompletedSteps(loadedCompleted);
        latestCompletedStepsRef.current = loadedCompleted;

        setSaveStatus('saved');
        return loadedProject;
      } catch (err) {
        console.error('Failed to initialize project draft:', err);
        return null;
      } finally {
        setLoading(false);
      }
    }

    initDraftPromiseRef.current = initProject();
  }, [
    authLoading,
    userProfile?.id,
    routeProjectId,
    searchParams,
    clientProfile,
    userProfile?.displayName,
    navigate,
    setSearchParams,
  ]);

  /**
   * Authoritative save operation.
   * Ensures:
   * 1. No conflicting concurrent writes to Firestore (awaits in-flight operation if one is running).
   * 2. Clears any pending debounced timer.
   * 3. Persists the exact provided data to the established projectId in Firestore.
   * 4. Accurately updates saveStatus ('saving' -> 'saved' or 'error').
   */
  const executeAuthoritativeSave = async (
    briefToSave: ProjectBrief,
    stepToSave: number,
    completedToSave: number[]
  ): Promise<void> => {
    const activeId = projectId || currentDraftIdRef.current;
    if (!activeId || !userProfile?.id) return;

    // Await any in-flight save before starting a new one to prevent out-of-order writes
    if (activeSavePromiseRef.current) {
      try {
        await activeSavePromiseRef.current;
      } catch {
        // Previous save failure handled, continue with latest authoritative save
      }
    }

    setSaveStatus('saving');

    const savePromise = (async () => {
      const currentTitle = briefToSave.title !== undefined ? briefToSave.title.trim() : '';
      const sanitized: ProjectBrief = {
        ...briefToSave,
        title: currentTitle,
      };
      await projectService.updateDraft(activeId, sanitized, stepToSave, completedToSave);
    })();

    activeSavePromiseRef.current = savePromise;

    try {
      await savePromise;
      setSaveStatus('saved');
      setSaveErrorMessage(null);
    } catch (err) {
      console.error('Authoritative save failed:', err);
      setSaveStatus('error');
      throw err;
    } finally {
      if (activeSavePromiseRef.current === savePromise) {
        activeSavePromiseRef.current = null;
      }
    }
  };

  // Debounced Autosave (1000ms delay)
  const triggerAutosave = useCallback(
    (updatedBrief: ProjectBrief, step: number, completed: number[]) => {
      const activeId = projectId || currentDraftIdRef.current;
      if (!activeId || !userProfile?.id) return;

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }

      setSaveStatus('saving');

      autosaveTimeoutRef.current = setTimeout(async () => {
        autosaveTimeoutRef.current = null;
        try {
          await executeAuthoritativeSave(updatedBrief, step, completed);
        } catch {
          // Error already logged and saveStatus set to 'error' by executeAuthoritativeSave
        }
      }, 1000);
    },
    [projectId, userProfile?.id]
  );

  // Retry autosave action
  const handleRetrySave = useCallback(async () => {
    const activeId = projectId || currentDraftIdRef.current;
    if (!activeId || !userProfile?.id) return;
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    setSaveErrorMessage(null);
    try {
      await executeAuthoritativeSave(
        latestBriefRef.current,
        latestStepRef.current,
        latestCompletedStepsRef.current
      );
    } catch (err) {
      console.error('Retry save failed:', err);
      setSaveErrorMessage("Couldn’t save your changes. Please try again.");
    }
  }, [projectId, userProfile?.id]);

  // Manual save draft and exit to Client Dashboard
  const handleSaveAndExit = async () => {
    // Guard against repeated clicks / race conditions
    if (isSavingAndExitingRef.current) return;

    isSavingAndExitingRef.current = true;
    setIsSavingAndExiting(true);
    setSaveErrorMessage(null);

    // 1. Immediately cancel any pending debounced autosave so it won't fire during or after navigation
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    try {
      // 2. If initial draft creation is still resolving, await it so we have the stable project and ID
      if (initDraftPromiseRef.current) {
        await initDraftPromiseRef.current;
      }

      const activeId = projectId || currentDraftIdRef.current;
      if (!activeId || !userProfile?.id) {
        navigate('/client');
        return;
      }

      // 3. Capture latest form state and flush authoritative save
      const currentBrief = latestBriefRef.current;
      const currentStepNum = latestStepRef.current;
      const currentCompleted = latestCompletedStepsRef.current;

      await executeAuthoritativeSave(currentBrief, currentStepNum, currentCompleted);

      // 4. Only after persistence succeeds, navigate to Client Dashboard
      navigate('/client');
    } catch (err) {
      console.error('Save & Exit failed:', err);
      // DO NOT navigate away automatically. Keep user on current step.
      setSaveErrorMessage("Couldn’t save your changes. Please try again.");
      setSaveStatus('error');
    } finally {
      isSavingAndExitingRef.current = false;
      setIsSavingAndExiting(false);
    }
  };

  // Update brief state helper
  const handleBriefChange = (updates: Partial<ProjectBrief>) => {
    const updated: ProjectBrief = {
      ...latestBriefRef.current,
      ...updates,
      timeline: {
        ...latestBriefRef.current.timeline,
        ...(updates.timeline || {}),
      },
      budget: {
        ...latestBriefRef.current.budget,
        ...(updates.budget || {}),
      },
    };
    latestBriefRef.current = updated;
    setBrief(updated);
    setStepErrors({});
    setSaveErrorMessage(null);
    triggerAutosave(updated, latestStepRef.current, latestCompletedStepsRef.current);
  };

  // Step validation before advancing
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!brief.serviceId) {
        errors.service = 'Please select a service category to continue.';
      }
    } else if (currentStep === 2) {
      if (!brief.projectTypeId) {
        errors.projectType = 'Please select a project type to continue.';
      }
    } else if (currentStep === 3) {
      if (!brief.title || brief.title.trim().length < 3) {
        errors.title = 'Please enter a project title (minimum 3 characters).';
      }
      if (!brief.description || brief.description.trim().length < 15) {
        errors.description = 'Please provide a project description (at least 15 characters).';
      }
      if (brief.existingUrl && brief.existingUrl.trim()) {
        const url = brief.existingUrl.trim();
        if (!/^https?:\/\/.+\..+/i.test(url) && !/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(url)) {
          errors.existingUrl = 'Please enter a valid website address.';
        }
      }
    } else if (currentStep === 6) {
      if (
        brief.timeline?.preferredStart === 'specific_date' &&
        !brief.timeline.startDate
      ) {
        errors.startDate = 'Please pick a start date.';
      }
      if (
        brief.timeline?.desiredCompletion === 'specific_date' &&
        !brief.timeline.completionDate
      ) {
        errors.completionDate = 'Please pick a completion date.';
      }
      if (
        brief.timeline?.startDate &&
        brief.timeline?.completionDate &&
        new Date(brief.timeline.completionDate) < new Date(brief.timeline.startDate)
      ) {
        errors.completionDate = 'Completion cannot be earlier than start date.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    let currentBrief = latestBriefRef.current;
    if (currentStep === 3 && currentBrief.title) {
      const trimmedTitle = currentBrief.title.trim();
      if (trimmedTitle !== currentBrief.title) {
        currentBrief = { ...currentBrief, title: trimmedTitle };
        latestBriefRef.current = currentBrief;
        setBrief(currentBrief);
      }
    }

    const nextStep = Math.min(currentStep + 1, BRIEF_STEPS.length);
    const updatedCompleted = Array.from(
      new Set([...latestCompletedStepsRef.current, currentStep, nextStep])
    );

    // Cancel pending debounce to avoid duplicate timer
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    setCurrentStep(nextStep);
    setCompletedSteps(updatedCompleted);
    latestStepRef.current = nextStep;
    latestCompletedStepsRef.current = updatedCompleted;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persist current step transition immediately
    try {
      await executeAuthoritativeSave(currentBrief, nextStep, updatedCompleted);
    } catch (err) {
      console.error('Save during step progression failed:', err);
    }
  };

  const handleBack = () => {
    if (isSavingAndExiting || isSubmitting) return;
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
    latestStepRef.current = prevStep;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerAutosave(latestBriefRef.current, prevStep, latestCompletedStepsRef.current);
  };

  const handleSelectStep = (stepNumber: number) => {
    if (isSavingAndExiting || isSubmitting) return;
    if (stepNumber > currentStep && !validateCurrentStep()) {
      return;
    }
    setCurrentStep(stepNumber);
    latestStepRef.current = stepNumber;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerAutosave(latestBriefRef.current, stepNumber, latestCompletedStepsRef.current);
  };

  // Full validation when entering review step
  useEffect(() => {
    if (currentStep === 9) {
      const { errors } = projectService.validateBrief(latestBriefRef.current);
      setValidationErrors(errors);
    }
  }, [currentStep, brief]);

  // Client-friendly submission error sanitizer
  const sanitizeSubmissionError = (err: unknown): string => {
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.startsWith('Submission blocked:')) {
        return msg.replace(/^Submission blocked:\s*/, '');
      }
      if (msg.includes('Illegal state transition') || msg.includes('already been submitted')) {
        return 'This project brief has already been submitted and cannot be resubmitted.';
      }
      if (msg.includes('Unauthorized')) {
        return 'You do not have permission to submit this project. Please verify your account.';
      }
      if (
        msg.includes('Firebase') ||
        msg.includes('Firestore') ||
        msg.includes('permission-denied') ||
        msg.includes('unavailable') ||
        msg.includes('INTERNAL') ||
        msg.includes('deadline-exceeded') ||
        msg.includes('network') ||
        msg.includes('Failed to fetch')
      ) {
        return 'We encountered a connection issue while submitting your brief. Please check your connection and try again.';
      }
      return msg;
    }
    return 'We were unable to submit your project brief at this time. Please try again.';
  };

  // Submit project handler
  const handleSubmitProject = async () => {
    if (!projectId || !userProfile?.id || isSubmitting || isSubmittingRef.current || isSavingAndExiting) return;

    // Immediately guard against double-clicks or rapid repeated clicks
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSaveErrorMessage(null);

    const trimmedTitle = (latestBriefRef.current.title || '').trim();
    const sanitizedBrief: ProjectBrief = {
      ...latestBriefRef.current,
      title: trimmedTitle,
    };

    const validation = projectService.validateBrief(sanitizedBrief);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Cancel pending debounce timer
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    try {
      // Ensure latest draft state is flushed to Firestore first
      await executeAuthoritativeSave(sanitizedBrief, 9, latestCompletedStepsRef.current);
      // Submit project via centralized state transition service
      const submitted = await projectService.submitProject(
        projectId,
        userProfile.id,
        clientProfile?.fullName || userProfile.displayName
      );

      navigate(`/client/projects/${submitted.id}`, { replace: true });
    } catch (err: unknown) {
      console.error('Submission failed:', err);
      const friendlyError = sanitizeSubmissionError(err);
      setValidationErrors([friendlyError]);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading || !projectId) {
    return (
      <div className="min-h-[60vh] bg-[var(--color-bg-app)] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" label="Preparing your project brief…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] pb-20">
      {/* Stepper Progress Bar */}
      <BriefStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onSelectStep={handleSelectStep}
        saveStatus={saveStatus}
        onRetrySave={handleRetrySave}
      />

      {/* Main Step Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 sm:p-10">
          {currentStep === 1 && (
            <StepService brief={brief} onChange={handleBriefChange} />
          )}

          {currentStep === 2 && (
            <StepProjectType
              brief={brief}
              onChange={handleBriefChange}
              onBackToService={() => handleSelectStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepProjectDetails
              brief={brief}
              onChange={handleBriefChange}
              errors={stepErrors}
            />
          )}

          {currentStep === 4 && (
            <StepFeatures brief={brief} onChange={handleBriefChange} />
          )}

          {currentStep === 5 && (
            <StepAssets brief={brief} onChange={handleBriefChange} />
          )}

          {currentStep === 6 && (
            <StepTimeline
              brief={brief}
              onChange={handleBriefChange}
              errors={stepErrors}
            />
          )}

          {currentStep === 7 && (
            <StepBudget brief={brief} onChange={handleBriefChange} />
          )}

          {currentStep === 8 && (
            <StepAdditional
              brief={brief}
              projectId={projectId}
              uploaderId={userProfile?.id || ''}
              onChange={handleBriefChange}
            />
          )}

          {currentStep === 9 && (
            <StepReview
              brief={brief}
              onEditSection={handleSelectStep}
              onSubmit={handleSubmitProject}
              isSubmitting={isSubmitting}
              validationErrors={validationErrors}
            />
          )}

          {/* Inline step error notice if blocking */}
          {Object.keys(stepErrors).length > 0 && currentStep !== 9 && (
            <div
              role="alert"
              className="mt-6 p-3.5 rounded-[var(--radius-card)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[13px] text-[var(--color-error-text)] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{Object.values(stepErrors)[0]}</span>
            </div>
          )}

          {/* Error Notice for Save Failure */}
          {saveErrorMessage && (
            <div
              role="alert"
              className="mt-6 p-4 rounded-[var(--radius-card)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] text-[13px] text-[var(--color-error-text)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0" aria-hidden="true" />
                <span>{saveErrorMessage}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndExit}
                className="text-xs shrink-0 self-start sm:self-auto"
              >
                Retry Save &amp; Exit
              </Button>
            </div>
          )}

          {/* Navigation Controls Bar */}
          <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  disabled={isSavingAndExiting || isSubmitting}
                  aria-label="Go back to previous step"
                >
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleSaveAndExit}
                leftIcon={!isSavingAndExiting ? <Save className="w-3.5 h-3.5" /> : undefined}
                isLoading={isSavingAndExiting}
                disabled={isSavingAndExiting || isSubmitting}
                aria-label="Save draft and exit to dashboard"
              >
                {isSavingAndExiting ? 'Saving…' : 'Save & Exit'}
              </Button>
            </div>

            {currentStep < BRIEF_STEPS.length && (
              <Button
                variant="primary"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                disabled={isSavingAndExiting || isSubmitting}
                aria-label="Continue to next step"
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
