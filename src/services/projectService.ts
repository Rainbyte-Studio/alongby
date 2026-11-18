import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Project,
  ProjectBrief,
  ProjectBriefSnapshot,
  ProjectState,
  ActivityEvent,
  UserRole,
} from '../types';
import { auditService } from './auditService';

/**
 * State Transition Rulebook
 * Enforces legal state machine transitions.
 */
const LEGAL_TRANSITIONS: Record<ProjectState, ProjectState[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['budget_review', 'matching', 'cancelled'],
  budget_review: ['matching', 'cancelled'],
  matching: ['awaiting_professional_responses', 'shortlist_review', 'cancelled'],
  awaiting_professional_responses: ['shortlist_review', 'shortlist_ready', 'cancelled'],
  shortlist_review: ['shortlist_ready', 'awaiting_professional_responses', 'cancelled'],
  shortlist_ready: ['professional_selected', 'shortlist_review', 'cancelled'],
  professional_selected: ['proposal_pending', 'cancelled'],
  proposal_pending: ['proposal_accepted', 'cancelled'],
  proposal_accepted: ['contract_pending', 'cancelled'],
  contract_pending: ['awaiting_signatures', 'cancelled'],
  awaiting_signatures: ['awaiting_deposit', 'cancelled'],
  awaiting_deposit: ['active_phase_1', 'cancelled'],
  active_phase_1: ['phase_1_review', 'paused', 'disputed', 'cancelled'],
  phase_1_review: ['awaiting_final_payment', 'disputed', 'cancelled'],
  awaiting_final_payment: ['active_phase_2', 'disputed', 'cancelled'],
  active_phase_2: ['final_review', 'paused', 'disputed', 'cancelled'],
  final_review: ['completed', 'disputed', 'cancelled'],
  completed: [],
  paused: ['active_phase_1', 'active_phase_2', 'cancelled'],
  cancelled: [],
  disputed: ['active_phase_1', 'active_phase_2', 'cancelled', 'completed'],
};

export const defaultEmptyBrief: ProjectBrief = {
  serviceId: '',
  projectTypeId: '',
  title: '',
  description: '',
  businessName: '',
  existingUrl: '',
  industryId: '',
  customIndustry: '',
  targetAudience: '',
  goals: [],
  customGoals: '',
  features: [],
  customFeatures: '',
  existingAssets: [],
  customAssets: '',
  timeline: {
    preferredStart: 'asap',
    desiredCompletion: 'flexible',
    flexibility: 'somewhat_flexible',
  },
  budget: {
    budgetType: 'range',
    selectedRangeId: 'eur_2000_3500',
    minAmountMinor: 200000,
    maxAmountMinor: 350000,
    currency: 'EUR',
    isIndicative: true,
  },
  additionalDetails: '',
  attachments: [],
};

// In-memory deduplication map for concurrent draft initialization
const inFlightDraftCreations = new Map<string, Promise<Project>>();
// In-memory deduplication map for concurrent project submissions
const inFlightSubmissions = new Map<string, Promise<Project>>();

export const projectService = {
  /**
   * Generates a stable Firestore project document ID synchronously client-side.
   */
  generateProjectId(): string {
    return doc(collection(db, 'projects')).id;
  },

  /**
   * State Machine Validator
   */
  canTransition(current: ProjectState, next: ProjectState): boolean {
    const allowed = LEGAL_TRANSITIONS[current] || [];
    return allowed.includes(next);
  },

  /**
   * Validate project brief prior to submission
   */
  validateBrief(brief: Partial<ProjectBrief>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!brief.serviceId) {
      errors.push('Please select a service category.');
    }
    if (!brief.projectTypeId) {
      errors.push('Please select a project type.');
    }
    if (!brief.title || brief.title.trim().length < 3) {
      errors.push('Project title must be at least 3 characters.');
    }
    if (!brief.description || brief.description.trim().length < 15) {
      errors.push('Please provide a project description (at least 15 characters).');
    }
    if (brief.existingUrl && brief.existingUrl.trim()) {
      const url = brief.existingUrl.trim();
      if (!/^https?:\/\/.+\..+/i.test(url) && !/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(url)) {
        errors.push('Please provide a valid website or app URL.');
      }
    }
    if (!brief.timeline || !brief.timeline.preferredStart) {
      errors.push('Please select a preferred start timeline.');
    }
    if (
      brief.timeline?.preferredStart === 'specific_date' &&
      !brief.timeline.startDate
    ) {
      errors.push('Please choose your target start date.');
    }
    if (
      brief.timeline?.desiredCompletion === 'specific_date' &&
      !brief.timeline.completionDate
    ) {
      errors.push('Please choose your desired completion date.');
    }
    if (
      brief.timeline?.startDate &&
      brief.timeline?.completionDate &&
      new Date(brief.timeline.completionDate) < new Date(brief.timeline.startDate)
    ) {
      errors.push('Completion date cannot be earlier than your start date.');
    }
    if (!brief.budget || !brief.budget.budgetType) {
      errors.push('Please provide an indicative budget range or select "I am not sure".');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Create a new draft project with optional predetermined projectId and idempotency protection.
   */
  async createDraft(
    clientId: string,
    clientName?: string,
    clientCompanyName?: string,
    initialData?: Partial<ProjectBrief>,
    predeterminedProjectId?: string
  ): Promise<Project> {
    const projectId = predeterminedProjectId || doc(collection(db, 'projects')).id;

    // In-memory concurrent promise deduplication
    const inFlight = inFlightDraftCreations.get(projectId);
    if (inFlight) {
      return inFlight;
    }

    const creationPromise = (async () => {
      const projectRef = doc(db, 'projects', projectId);

      // Firestore idempotency check: if document already exists, return existing project
      const existingSnap = await getDoc(projectRef);
      if (existingSnap.exists()) {
        return existingSnap.data() as Project;
      }

      const now = new Date().toISOString();

      const trimmedInitialTitle = initialData?.title?.trim() || '';
      const sanitizedCompanyName = (clientCompanyName || '').trim();
      const initialBusinessName = (initialData?.businessName || '').trim();
      // Prefill using real profile company name or initial data, never hardcoded demo fallbacks
      const finalBusinessName = sanitizedCompanyName || initialBusinessName || '';

      const mergedBrief: ProjectBrief = {
        ...defaultEmptyBrief,
        ...initialData,
        title: trimmedInitialTitle,
        businessName: finalBusinessName,
      };

      const project: Project = {
        id: projectId,
        clientId,
        clientName: clientName || '',
        clientCompanyName: sanitizedCompanyName,
        title: trimmedInitialTitle,
        serviceId: mergedBrief.serviceId || '',
        projectTypeId: mergedBrief.projectTypeId || '',
        brief: mergedBrief,
        status: 'draft',
        currentStep: 1,
        draftCompletedSteps: [1],
        version: 1,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(projectRef, project);

      // Record activity event
      await this.logActivity(
        projectId,
        clientId,
        'client',
        'project_created',
        'Project draft started',
        'Initial project brief draft initiated.',
        { title: project.title || 'Project Draft' },
        clientName
      );

      return project;
    })();

    inFlightDraftCreations.set(projectId, creationPromise);
    try {
      return await creationPromise;
    } finally {
      inFlightDraftCreations.delete(projectId);
    }
  },

  /**
   * Authoritatively get an existing draft or create a new one with the given projectId.
   * Guarantees that only ONE document is ever created for this projectId.
   */
  async getOrCreateDraft(
    projectId: string,
    clientId: string,
    clientName?: string,
    clientCompanyName?: string,
    initialData?: Partial<ProjectBrief>
  ): Promise<Project> {
    const inFlight = inFlightDraftCreations.get(projectId);
    if (inFlight) {
      return inFlight;
    }

    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (snap.exists()) {
      return snap.data() as Project;
    }

    return this.createDraft(clientId, clientName, clientCompanyName, initialData, projectId);
  },

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    const snap = await getDoc(doc(db, 'projects', projectId));
    if (!snap.exists()) return null;
    return snap.data() as Project;
  },

  /**
   * Get all projects for a client
   */
  async getClientProjects(clientId: string): Promise<Project[]> {
    const q = query(
      collection(db, 'projects'),
      where('clientId', '==', clientId),
      orderBy('updatedAt', 'desc')
    );

    try {
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Project);
    } catch (err) {
      console.warn('Index might be required for client query, fallback query without order:', err);
      const fallbackQ = query(collection(db, 'projects'), where('clientId', '==', clientId));
      const snap = await getDocs(fallbackQ);
      const projects = snap.docs.map((d) => d.data() as Project);
      return projects.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  },

  /**
   * Admin: Get all projects across the platform
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      const snap = await getDocs(collection(db, 'projects'));
      const projects = snap.docs.map((d) => d.data() as Project);
      return projects.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (err) {
      console.error('Failed to get all projects for admin:', err);
      return [];
    }
  },


  /**
   * Update draft project (debounced or manual save)
   */
  async updateDraft(
    projectId: string,
    partialBrief: Partial<ProjectBrief>,
    currentStep?: number,
    completedSteps?: number[]
  ): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    const existingSnap = await getDoc(projectRef);
    if (!existingSnap.exists()) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const existing = existingSnap.data() as Project;
    if (existing.status !== 'draft') {
      throw new Error('Only draft projects can be modified in Phase 2.');
    }

    // Safely handle title:
    // If partialBrief.title is provided, trim it (can safely be empty '' while in draft).
    // If partialBrief.title is undefined, preserve existing title.
    const newTitle = partialBrief.title !== undefined
      ? partialBrief.title.trim()
      : (existing.brief?.title !== undefined ? existing.brief.title : (existing.title || ''));

    const newBusinessName = partialBrief.businessName !== undefined
      ? partialBrief.businessName.trim()
      : (existing.brief?.businessName !== undefined ? existing.brief.businessName : '');

    const updatedBrief: ProjectBrief = {
      ...existing.brief,
      ...partialBrief,
      title: newTitle,
      businessName: newBusinessName,
      timeline: {
        ...existing.brief.timeline,
        ...(partialBrief.timeline || {}),
      },
      budget: {
        ...existing.brief.budget,
        ...(partialBrief.budget || {}),
      },
    };

    const updatePayload: Record<string, unknown> = {
      brief: updatedBrief,
      title: newTitle,
      serviceId: updatedBrief.serviceId || existing.serviceId || '',
      projectTypeId: updatedBrief.projectTypeId || existing.projectTypeId || '',
      updatedAt: new Date().toISOString(),
    };

    if (currentStep !== undefined) {
      updatePayload.currentStep = currentStep;
    }

    if (completedSteps !== undefined) {
      updatePayload.draftCompletedSteps = Array.from(
        new Set([...(existing.draftCompletedSteps || []), ...completedSteps])
      );
    }

    await updateDoc(projectRef, updatePayload);
  },

  /**
   * Rename an unsubmitted draft project.
   * Enforces:
   * - Caller owns the draft (project.clientId === actorId)
   * - Project is still in 'draft' status
   * - Cannot rename submitted or active projects
   * - Trims whitespace, enforces length between 3 and 120 chars
   * - Updates project.title and project.brief.title in Firestore
   * - Does not alter arbitrary other project fields
   */
  async renameDraft(
    projectId: string,
    newTitle: string,
    actorId: string
  ): Promise<void> {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      throw new Error('Project title must be at least 3 characters.');
    }
    if (trimmedTitle.length > 120) {
      throw new Error('Project title cannot exceed 120 characters.');
    }

    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) {
      throw new Error('Project not found.');
    }

    const project = snap.data() as Project;
    if (project.clientId !== actorId) {
      throw new Error('Unauthorized to rename this project.');
    }

    if (project.status !== 'draft') {
      throw new Error('This project can no longer be renamed because it has already been submitted.');
    }

    const updatedBrief: ProjectBrief = {
      ...project.brief,
      title: trimmedTitle,
    };

    const now = new Date().toISOString();

    await updateDoc(projectRef, {
      title: trimmedTitle,
      brief: updatedBrief,
      updatedAt: now,
    });

    await this.logActivity(
      projectId,
      actorId,
      'client',
      'project_updated',
      'Draft Renamed',
      `Draft title changed to "${trimmedTitle}".`,
      { title: trimmedTitle }
    );
  },

  /**
   * Authoritatively delete an unsubmitted draft project and all associated draft-only data.
   * Strictly validates:
   * 1. Authenticated user owns the project (project.clientId === actorId)
   * 2. Project is currently in 'draft' status
   * 3. Has never been submitted (no submittedAt timestamp or snapshot)
   * 4. Matching has not started and no opportunities exist
   * 5. No shortlist or selection records exist
   * 6. No proposals exist
   * 7. No contracts exist
   * 8. No payment records exist
   *
   * Atomically cleans up draft-only subcollections (activityEvents, briefSnapshots, matches)
   * and the project document itself via writeBatch.
   */
  async deleteDraft(
    projectId: string,
    actorId: string
  ): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) {
      // Idempotent: already deleted
      return;
    }

    const project = snap.data() as Project;

    // 1. Authoritative ownership verification
    if (project.clientId !== actorId) {
      throw new Error('Unauthorized: You can only delete drafts that you created.');
    }

    // 2. Authoritative draft status verification
    if (project.status !== 'draft') {
      throw new Error('This project can no longer be deleted because it has already been submitted.');
    }

    // 3. Verify project has never been submitted
    if (project.submittedAt) {
      throw new Error('This project can no longer be deleted because it has already been submitted.');
    }

    // 4. Verify absence of downstream subcollection records
    // Check subcollection: selection
    const selectionSnap = await getDocs(collection(db, 'projects', projectId, 'selection'));
    if (!selectionSnap.empty) {
      throw new Error('This project can no longer be deleted because a specialist has already been selected.');
    }

    // Check subcollection: shortlists
    const shortlistSnap = await getDocs(collection(db, 'projects', projectId, 'shortlists'));
    if (!shortlistSnap.empty) {
      throw new Error('This project can no longer be deleted because a shortlist exists.');
    }

    // Check subcollection: publishedShortlist
    const publishedShortlistSnap = await getDocs(collection(db, 'projects', projectId, 'publishedShortlist'));
    if (!publishedShortlistSnap.empty) {
      throw new Error('This project can no longer be deleted because a shortlist has been published.');
    }

    // Check subcollection: briefSnapshots (ensure no submitted brief snapshot exists)
    const snapshotsSnap = await getDocs(collection(db, 'projects', projectId, 'briefSnapshots'));
    const hasSubmittedSnapshot = snapshotsSnap.docs.some(
      (d) => d.data().statusAtSnapshot !== 'draft'
    );
    if (hasSubmittedSnapshot) {
      throw new Error('This project can no longer be deleted because it has already been submitted.');
    }

    // 5. Clean up draft-only documents and subcollections
    // Delete child subcollection records first so parent existence check in rules succeeds
    const subBatch = writeBatch(db);
    let hasSubDocs = false;

    // Delete draft activity events
    const activitiesSnap = await getDocs(collection(db, 'projects', projectId, 'activityEvents'));
    activitiesSnap.forEach((docSnap) => {
      subBatch.delete(docSnap.ref);
      hasSubDocs = true;
    });

    // Delete any draft brief snapshots
    snapshotsSnap.forEach((docSnap) => {
      subBatch.delete(docSnap.ref);
      hasSubDocs = true;
    });

    // Delete any draft matches if present
    const matchesSnap = await getDocs(collection(db, 'projects', projectId, 'matches'));
    matchesSnap.forEach((docSnap) => {
      subBatch.delete(docSnap.ref);
      hasSubDocs = true;
    });

    if (hasSubDocs) {
      await subBatch.commit();
    }

    // Delete the project draft document itself
    await deleteDoc(projectRef);
  },

  /**
   * Submit project brief
   * Transitions state from 'draft' to 'submitted'
   * Creates an immutable brief snapshot and audit activity log
   */
  async submitProject(
    projectId: string,
    actorId: string,
    actorName?: string
  ): Promise<Project> {
    const inFlight = inFlightSubmissions.get(projectId);
    if (inFlight) {
      return inFlight;
    }

    const submissionPromise = (async () => {
      const projectRef = doc(db, 'projects', projectId);
      const snap = await getDoc(projectRef);
      if (!snap.exists()) {
        throw new Error(`Project ${projectId} does not exist.`);
      }

      const project = snap.data() as Project;

      // Check ownership
      if (project.clientId !== actorId) {
        throw new Error('Unauthorized to submit this project.');
      }

      // Idempotency: If project is already submitted, return the existing submitted project safely
      if (project.status === 'submitted') {
        return project;
      }

      // State machine check
      if (!this.canTransition(project.status, 'submitted')) {
        throw new Error(`Illegal state transition from "${project.status}" to "submitted".`);
      }

      // Whitespace trimming & validation of required project title
      const trimmedTitle = (project.brief?.title || project.title || '').trim();
      if (!trimmedTitle || trimmedTitle.length < 3) {
        throw new Error('Submission blocked: Project title is required and must be at least 3 characters.');
      }

      const sanitizedBrief: ProjectBrief = {
        ...project.brief,
        title: trimmedTitle,
      };

      // Full brief validation
      const validation = this.validateBrief(sanitizedBrief);
      if (!validation.valid) {
        throw new Error(`Submission blocked: ${validation.errors.join(' ')}`);
      }

      const now = new Date().toISOString();

      // 1. Create immutable snapshot in projects/{projectId}/briefSnapshots/{snapshotId}
      const snapshotRef = doc(collection(db, 'projects', projectId, 'briefSnapshots'));
      const snapshot: ProjectBriefSnapshot = {
        id: snapshotRef.id,
        projectId,
        clientId: project.clientId,
        version: project.version || 1,
        brief: JSON.parse(JSON.stringify(sanitizedBrief)), // Deep clone
        statusAtSnapshot: 'submitted',
        reason: 'initial_submission',
        createdAt: now,
        createdBy: actorId,
      };
      await setDoc(snapshotRef, snapshot);

      // 2. Transition project to submitted
      const updatedProject: Project = {
        ...project,
        title: trimmedTitle,
        brief: sanitizedBrief,
        status: 'submitted',
        submittedAt: now,
        updatedAt: now,
        currentStep: 9,
      };

      await updateDoc(projectRef, {
        title: trimmedTitle,
        brief: sanitizedBrief,
        status: 'submitted',
        submittedAt: now,
        updatedAt: now,
        currentStep: 9,
      });

      // 3. Log activity event
      await this.logActivity(
        projectId,
        actorId,
        'client',
        'project_submitted',
        'Project brief submitted',
        'Your project brief was submitted and matching has started.',
        {
          serviceId: project.serviceId,
          projectTypeId: project.projectTypeId,
          title: trimmedTitle,
        },
        actorName
      );

      // 4. Audit trail
      await auditService.logEvent(
        actorId,
        'client',
        'PROJECT_SUBMITTED',
        'project',
        projectId,
        { version: project.version, snapshotId: snapshotRef.id }
      );

      // 5. Auto-trigger matching engine so candidates are immediately surfaced
      try {
        const { matchingService } = await import('./matchingService');
        await matchingService.runMatchingForProject(projectId, actorId);
        updatedProject.status = 'matching';
      } catch (matchErr) {
        console.warn('Initial matching run deferred:', matchErr);
      }

      return updatedProject;
    })();

    inFlightSubmissions.set(projectId, submissionPromise);
    try {
      return await submissionPromise;
    } finally {
      inFlightSubmissions.delete(projectId);
    }
  },

  /**
   * Log an activity event for this project
   */
  async logActivity(
    projectId: string,
    actorId: string,
    actorRole: UserRole,
    eventType: string,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>,
    actorName?: string
  ): Promise<string> {
    const activityRef = doc(collection(db, 'projects', projectId, 'activityEvents'));
    const event: ActivityEvent = {
      id: activityRef.id,
      projectId,
      actorId,
      actorRole,
      actorName: actorName || 'Client',
      eventType,
      title,
      description: description || '',
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    };

    await setDoc(activityRef, event);
    return activityRef.id;
  },

  /**
   * Get activity events for a project
   */
  async getActivityEvents(projectId: string): Promise<ActivityEvent[]> {
    try {
      const q = query(
        collection(db, 'projects', projectId, 'activityEvents'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ActivityEvent);
    } catch (err) {
      console.warn('Fallback getting activity events without ordering:', err);
      const snap = await getDocs(collection(db, 'projects', projectId, 'activityEvents'));
      const list = snap.docs.map((d) => d.data() as ActivityEvent);
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  },

  /**
   * Get immutable snapshots for a project
   */
  async getBriefSnapshots(projectId: string): Promise<ProjectBriefSnapshot[]> {
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'briefSnapshots'));
      const list = snap.docs.map((d) => d.data() as ProjectBriefSnapshot);
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.warn('Error fetching brief snapshots:', err);
      return [];
    }
  },
};
