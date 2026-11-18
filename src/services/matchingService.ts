import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Project,
  ProfessionalProfile,
  ProfessionalAvailability,
  ProjectMatch,
  ScoreBreakdown,
  MatchStatus,
  UserRole,
} from '../types';
import { eligibilityService } from './eligibilityService';
import { availabilityService } from './availabilityService';
import { profileService } from './profileService';
import { projectService } from './projectService';
import { auditService } from './auditService';
import { taxonomyNormalizer } from './taxonomyNormalizer';
import { taxonomyService } from './taxonomyService';

export const MATCHING_VERSION = 'v1';

export interface MatchingOptions {
  maxCandidates?: number;
  minScoreThreshold?: number;
}

export const matchingService = {
  /**
   * Deterministic scoring algorithm (v1)
   */
  calculateScore(
    project: Project,
    prof: ProfessionalProfile,
    avail: ProfessionalAvailability | null
  ): { score: number; breakdown: ScoreBreakdown; matchReasons: string[] } {
    const reasons: string[] = [];

    // 1. Service & Skills (max 30 pts)
    let serviceAndSkills = 0;
    const canonicalProjService = taxonomyNormalizer.normalizeServiceId(project.serviceId);
    const profCanonicalServices = (prof.primaryServices || []).map((s) => taxonomyNormalizer.normalizeServiceId(s));
    const titleCanonical = prof.professionalTitle ? taxonomyNormalizer.normalizeServiceId(prof.professionalTitle) : '';

    if (profCanonicalServices.includes(canonicalProjService) || titleCanonical === canonicalProjService) {
      serviceAndSkills += 18;
      const serviceDef = taxonomyService.getServiceCategoryById(canonicalProjService);
      const serviceName = serviceDef?.name || canonicalProjService.replace(/_/g, ' ');
      reasons.push(`Core specialty aligned with ${serviceName}`);
    } else if (taxonomyNormalizer.isServiceCompatible(project.serviceId, prof.primaryServices || [], prof.professionalTitle)) {
      serviceAndSkills += 14;
      reasons.push(`Direct cross-domain experience in ${canonicalProjService.replace(/_/g, ' ')} solutions`);
    } else {
      serviceAndSkills += 6;
    }

    // Match skills with project features & skills
    const skillFit = taxonomyNormalizer.calculateSkillFit(project.brief?.features || [], prof.skills || []);
    if (skillFit.overlapCount >= 2 || skillFit.fitRatio >= 0.5) {
      serviceAndSkills += 12;
      reasons.push(`Strong technology and skill coverage (${skillFit.matchingSkills.slice(0, 3).join(', ')})`);
    } else if (skillFit.overlapCount >= 1) {
      serviceAndSkills += 8;
      reasons.push(`Key skill match (${skillFit.matchingSkills[0]})`);
    } else if ((prof.skills || []).length > 0) {
      serviceAndSkills += 5;
    }

    serviceAndSkills = Math.min(30, serviceAndSkills);

    // 2. Relevant Experience (max 20 pts)
    let relevantExperience = 0;
    const yoe = prof.yearsOfExperience || 0;
    if (yoe >= 8) {
      relevantExperience += 12;
      reasons.push(`${yoe}+ years veteran practitioner experience`);
    } else if (yoe >= 5) {
      relevantExperience += 10;
      reasons.push(`${yoe} years verified professional delivery experience`);
    } else if (yoe >= 3) {
      relevantExperience += 8;
    } else {
      relevantExperience += 5;
    }

    // Project Type / Industry Alignment
    const profIndustries = taxonomyNormalizer.normalizeIndustryList(prof.industries || []);
    const projectIndustry = taxonomyNormalizer.normalizeIndustry(project.brief?.industryId || project.brief?.customIndustry);
    if (projectIndustry && profIndustries.includes(projectIndustry)) {
      relevantExperience += 8;
      reasons.push(`Direct domain experience in ${project.brief?.industryId || projectIndustry}`);
    } else {
      relevantExperience += 4;
    }

    relevantExperience = Math.min(20, relevantExperience);

    // 3. Availability (max 20 pts)
    let availabilityScore = 0;
    if (avail) {
      if (avail.availabilityStatus === 'available') {
        availabilityScore += 14;
        reasons.push('Available now for new client engagement');
      } else if (avail.availabilityStatus === 'limited') {
        availabilityScore += 9;
        reasons.push('Limited capacity window available');
      }

      // Proximity to start date
      const now = new Date().getTime();
      const nextDate = avail.nextAvailableDate ? new Date(avail.nextAvailableDate).getTime() : now;
      const daysUntilReady = Math.max(0, Math.round((nextDate - now) / (1000 * 60 * 60 * 24)));

      if (daysUntilReady <= 7) {
        availabilityScore += 6;
        reasons.push('Immediate kick-off readiness (within 7 days)');
      } else if (daysUntilReady <= 21) {
        availabilityScore += 4;
      } else {
        availabilityScore += 2;
      }
    } else {
      availabilityScore += 8;
    }
    availabilityScore = Math.min(20, availabilityScore);

    // 4. Budget Fit (max 15 pts) - Normalized Minor Units
    let budgetFit = 0;
    const clientMin = taxonomyNormalizer.normalizeBudgetMinor(project.brief?.budget?.minAmountMinor);
    const clientMax = taxonomyNormalizer.normalizeBudgetMinor(project.brief?.budget?.maxAmountMinor);
    const profFloor = taxonomyNormalizer.normalizeBudgetMinor(prof.minimumBudgetMinor);

    if (project.brief?.budget?.budgetType === 'unsure' || (!clientMax && !clientMin)) {
      budgetFit = 10;
      reasons.push('Flexible commercial scope suited for indicative engagement');
    } else if (clientMax > 0) {
      if (profFloor <= clientMin) {
        budgetFit = 15;
        reasons.push(`Budget fully accommodates professional baseline (€${(profFloor / 100).toLocaleString()})`);
      } else if (profFloor <= clientMax) {
        budgetFit = 13;
        reasons.push(`Professional minimum engagement (€${(profFloor / 100).toLocaleString()}) sits comfortably within client range`);
      } else {
        budgetFit = 6;
      }
    } else {
      budgetFit = 10;
    }
    budgetFit = Math.min(15, budgetFit);

    // 5. Rating & Reliability (max 10 pts)
    let ratingReliability = 0;
    const rating = prof.averageRating ?? 5.0;
    if (rating >= 4.8) {
      ratingReliability += 6;
    } else if (rating >= 4.5) {
      ratingReliability += 4;
    } else {
      ratingReliability += 3;
    }

    const completed = prof.completedProjectCount ?? 0;
    if (completed >= 5) {
      ratingReliability += 4;
      reasons.push(`Established track record (${completed} verified marketplace deliveries)`);
    } else if (completed >= 1) {
      ratingReliability += 3;
    } else {
      ratingReliability += 2;
    }
    ratingReliability = Math.min(10, ratingReliability);

    // 6. Workload (max 5 pts)
    let workload = 0;
    const currentActive = avail?.currentActiveProjectCount ?? 0;
    const maxAllowed = avail?.maximumConcurrentProjects ?? 2;
    const spotsRemaining = Math.max(0, maxAllowed - currentActive);

    if (spotsRemaining >= 2) {
      workload = 5;
    } else if (spotsRemaining === 1) {
      workload = 3;
    } else {
      workload = 1;
    }

    const total = serviceAndSkills + relevantExperience + availabilityScore + budgetFit + ratingReliability + workload;

    return {
      score: Math.min(100, Math.max(0, total)),
      breakdown: {
        serviceAndSkills,
        relevantExperience,
        availability: availabilityScore,
        budgetFit,
        ratingReliability,
        workload,
        total,
      },
      matchReasons: Array.from(new Set(reasons)),
    };
  },

  /**
   * Run matching pipeline for a submitted project
   * Admin-initiated or trigger-driven
   */
  async runMatchingForProject(
    projectId: string,
    actorId: string,
    options: MatchingOptions = {}
  ): Promise<ProjectMatch[]> {
    const maxCandidates = options.maxCandidates || 10;
    const minThreshold = options.minScoreThreshold || 30;

    // 1. Fetch project
    const project = await projectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    // 2. Fetch all registered professionals & their availabilities
    const professionals = await profileService.getAllProfessionals();
    if (!professionals || professionals.length === 0) {
      return [];
    }

    // Fetch availabilities concurrently
    const availabilities = await Promise.all(
      professionals.map((p) => availabilityService.getAvailability(p.userId))
    );
    const availMap = new Map<string, ProfessionalAvailability | null>();
    professionals.forEach((p, idx) => {
      availMap.set(p.userId, availabilities[idx]);
    });

    // Fetch existing matches to preserve existing lifecycle states
    const existingMatchesSnap = await getDocs(collection(db, 'projects', projectId, 'matches'));
    const existingMatchesMap = new Map<string, ProjectMatch>();
    for (const d of existingMatchesSnap.docs) {
      existingMatchesMap.set(d.id, d.data() as ProjectMatch);
    }

    // 3. Evaluate eligibility and score candidates
    const evaluated: ProjectMatch[] = [];
    const nowIso = new Date().toISOString();

    for (const prof of professionals) {
      const avail = availMap.get(prof.userId) || null;
      const eligibility = eligibilityService.evaluateEligibility(project, prof, avail);

      const { score, breakdown, matchReasons } = this.calculateScore(project, prof, avail);

      const matchId = `match_${prof.userId}`;
      const existing = existingMatchesMap.get(matchId);

      const matchDoc: ProjectMatch = {
        id: matchId,
        projectId,
        professionalId: prof.userId,
        professionalName: prof.displayName || 'Professional',
        professionalTitle: prof.professionalTitle || '',
        professionalCountry: prof.country || '',
        professionalTimezone: prof.timezone || '',
        verificationStatus: prof.verificationStatus,
        availabilityStatus: avail?.availabilityStatus || 'available',
        nextAvailableDate: avail?.nextAvailableDate || nowIso.split('T')[0],
        minimumBudgetMinor: taxonomyNormalizer.normalizeBudgetMinor(prof.minimumBudgetMinor),
        currency: prof.currency || 'EUR',
        eligibilityStatus: eligibility.eligible ? 'eligible' : 'ineligible',
        eligibilityReasons: eligibility.reasons,
        matchScore: score,
        scoreBreakdown: breakdown,
        matchReasons,
        warnings: eligibility.warnings,
        matchingVersion: MATCHING_VERSION,
        status: existing?.status || 'candidate',
        ...(existing?.opportunityId ? { opportunityId: existing.opportunityId } : {}),
        ...(existing?.excludedAt ? { excludedAt: existing.excludedAt } : {}),
        ...(existing?.excludedBy ? { excludedBy: existing.excludedBy } : {}),
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      evaluated.push(matchDoc);
    }

    // 4. Sort candidates: eligible first, then by matchScore descending
    evaluated.sort((a, b) => {
      if (a.eligibilityStatus === 'eligible' && b.eligibilityStatus !== 'eligible') return -1;
      if (a.eligibilityStatus !== 'eligible' && b.eligibilityStatus === 'eligible') return 1;
      return b.matchScore - a.matchScore;
    });

    // Take top candidates
    const topCandidates = evaluated.slice(0, maxCandidates);

    // 5. Persist to Firestore under projects/{projectId}/matches/{matchId}
    for (const candidate of topCandidates) {
      const matchRef = doc(db, 'projects', projectId, 'matches', candidate.id);
      await setDoc(matchRef, candidate, { merge: true });
    }

    // 6. Transition project status to 'matching' if it was 'submitted'
    if (project.status === 'submitted') {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'matching',
        updatedAt: nowIso,
      });

      try {
        await projectService.logActivity(
          projectId,
          actorId,
          'admin',
          'matching_initiated',
          'Matching analysis initiated',
          `Curated matching evaluated ${professionals.length} professionals; ${topCandidates.filter((c) => c.eligibilityStatus === 'eligible').length} eligible candidates surfaced.`,
          { candidatesCount: topCandidates.length }
        );
      } catch (logErr) {
        console.warn('Matching activity log deferred:', logErr);
      }
    }

    // 7. Audit event
    try {
      await auditService.logEvent(
        actorId,
        'admin',
        'MATCHING_RUN',
        'project',
        projectId,
        { candidateCount: topCandidates.length, version: MATCHING_VERSION }
      );
    } catch (auditErr) {
      console.warn('Matching audit log deferred:', auditErr);
    }

    return topCandidates;
  },

  /**
   * Retrieve matches for a project
   */
  async getMatchesForProject(projectId: string): Promise<ProjectMatch[]> {
    const snap = await getDocs(collection(db, 'projects', projectId, 'matches'));
    const list = snap.docs.map((d) => d.data() as ProjectMatch);
    // Sort: eligible first, then matchScore desc
    return list.sort((a, b) => {
      if (a.eligibilityStatus === 'eligible' && b.eligibilityStatus !== 'eligible') return -1;
      if (a.eligibilityStatus !== 'eligible' && b.eligibilityStatus === 'eligible') return 1;
      return b.matchScore - a.matchScore;
    });
  },

  /**
   * Update match record status
   */
  async updateMatchStatus(
    projectId: string,
    matchId: string,
    status: MatchStatus,
    opportunityId?: string
  ): Promise<void> {
    const matchRef = doc(db, 'projects', projectId, 'matches', matchId);
    const updatePayload: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (opportunityId) {
      updatePayload.opportunityId = opportunityId;
    }
    await updateDoc(matchRef, updatePayload);
  },

  /**
   * Admin excludes candidate from this project's matching candidate pool
   */
  async excludeMatchCandidate(
    projectId: string,
    matchId: string,
    actorId: string
  ): Promise<void> {
    const matchRef = doc(db, 'projects', projectId, 'matches', matchId);
    const nowIso = new Date().toISOString();
    await updateDoc(matchRef, {
      status: 'excluded',
      excludedAt: nowIso,
      excludedBy: actorId,
      updatedAt: nowIso,
    });
    await auditService.logEvent(
      actorId,
      'admin',
      'MATCH_CANDIDATE_EXCLUDED',
      'projectMatch',
      matchId,
      { projectId }
    );
  },

  /**
   * Legacy alias for removing/excluding candidate from match list
   */
  async removeMatchCandidate(
    projectId: string,
    matchId: string,
    actorId: string
  ): Promise<void> {
    return this.excludeMatchCandidate(projectId, matchId, actorId);
  },
};
