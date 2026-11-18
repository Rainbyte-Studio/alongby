import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Opportunity,
  OpportunityProjectSnapshot,
  OpportunityStatus,
  PassReason,
  Project,
  ProjectMatch,
} from '../types';
import { projectService } from './projectService';
import { matchingService } from './matchingService';
import { taxonomyService } from './taxonomyService';
import { auditService } from './auditService';

export const DEFAULT_OPPORTUNITY_EXPIRY_DAYS = 7;

export const opportunityService = {
  /**
   * Admin dispatches a private curated opportunity to a matched professional
   */
  async createOpportunity(
    projectId: string,
    professionalId: string,
    matchId: string,
    actorId: string,
    expiryDays = DEFAULT_OPPORTUNITY_EXPIRY_DAYS
  ): Promise<Opportunity> {
    const project = await projectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const service = taxonomyService.getServiceCategoryById(project.serviceId);
    const projectType = service?.projectTypes.find((pt) => pt.id === project.projectTypeId);
    const industry = taxonomyService.getIndustries().find((i) => i.id === project.brief.industryId);

    // Fetch match record for reasons
    const matchSnap = await getDoc(doc(db, 'projects', projectId, 'matches', matchId));
    const matchData = matchSnap.exists() ? (matchSnap.data() as ProjectMatch) : null;
    const matchReasons = matchData?.matchReasons || ['Strong alignment with verified expertise'];

    // Fetch latest brief snapshot for reference
    let projectSnapshotId = '';
    try {
      const snapsRef = collection(db, 'projects', projectId, 'briefSnapshots');
      const snapDocs = await getDocs(query(snapsRef, orderBy('createdAt', 'desc')));
      if (snapDocs.docs.length > 0) {
        projectSnapshotId = snapDocs.docs[0].id;
      }
    } catch {
      // If composite index is building or no snapshots exist
      projectSnapshotId = projectId;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Construct safe, sanitized project snapshot (PII protected)
    const projectSnapshot: OpportunityProjectSnapshot = {
      projectId,
      serviceId: project.serviceId,
      serviceName: service?.name || project.serviceId,
      projectTypeId: project.projectTypeId,
      projectTypeName: projectType?.name || project.projectTypeId,
      title: project.title,
      description: project.brief.description,
      industryName: industry?.name || project.brief.customIndustry || 'General Business',
      goals: project.brief.goals || [],
      features: project.brief.features || [],
      existingAssets: project.brief.existingAssets || [],
      indicativeBudget: project.brief.budget,
      timeline: project.brief.timeline,
      attachments: (project.brief.attachments || []).map((att) => ({
        fileId: att.fileId,
        name: att.name,
        contentType: att.contentType,
        size: att.size,
        downloadUrl: att.downloadUrl,
      })),
    };

    // 2. Persist opportunity
    const oppRef = doc(collection(db, 'opportunities'));
    const opportunity: Opportunity = {
      id: oppRef.id,
      projectId,
      professionalId,
      matchId,
      projectSnapshotId,
      status: 'pending',
      projectSnapshot,
      matchReasons,
      expiresAt,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorId,
    };

    await setDoc(oppRef, opportunity);

    // 3. Update Match Candidate status
    await matchingService.updateMatchStatus(
      projectId,
      matchId,
      'opportunity_sent',
      oppRef.id
    );

    // 4. Transition Project status to 'awaiting_professional_responses' if in 'submitted' or 'matching'
    if (project.status === 'submitted' || project.status === 'matching') {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'awaiting_professional_responses',
        updatedAt: nowIso,
      });

      await projectService.logActivity(
        projectId,
        actorId,
        'admin',
        'opportunity_sent',
        'Private opportunity dispatched',
        'Selected verified professional was invited to review project specifications and submit a commercial quote.',
        { opportunityId: oppRef.id, expiresAt }
      );
    }

    // 5. Audit log
    await auditService.logEvent(
      actorId,
      'admin',
      'OPPORTUNITY_DISPATCHED',
      'opportunity',
      oppRef.id,
      { projectId, professionalId, matchId, expiresAt }
    );

    return opportunity;
  },

  /**
   * Fetch all opportunities assigned to a professional
   */
  async getOpportunitiesForProfessional(professionalId: string): Promise<Opportunity[]> {
    try {
      const q = query(
        collection(db, 'opportunities'),
        where('professionalId', '==', professionalId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as Opportunity);
      return this.checkAndMarkExpired(list);
    } catch (err) {
      console.warn('Fallback querying opportunities without orderBy:', err);
      const fallbackQ = query(
        collection(db, 'opportunities'),
        where('professionalId', '==', professionalId)
      );
      const snap = await getDocs(fallbackQ);
      const list = snap.docs.map((d) => d.data() as Opportunity);
      const sorted = list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return this.checkAndMarkExpired(sorted);
    }
  },

  /**
   * Get single opportunity by ID
   */
  async getOpportunity(
    opportunityId: string,
    authorizedProfId?: string
  ): Promise<Opportunity | null> {
    const snap = await getDoc(doc(db, 'opportunities', opportunityId));
    if (!snap.exists()) return null;

    const opp = snap.data() as Opportunity;

    if (authorizedProfId && opp.professionalId !== authorizedProfId) {
      throw new Error('Unauthorized to view this opportunity.');
    }

    const [updatedOpp] = this.checkAndMarkExpired([opp]);
    return updatedOpp;
  },

  /**
   * Mark opportunity as viewed when opened by the professional
   */
  async markOpportunityViewed(opportunityId: string, professionalId: string): Promise<void> {
    const opp = await this.getOpportunity(opportunityId, professionalId);
    if (!opp) return;

    if (opp.status === 'pending') {
      const oppRef = doc(db, 'opportunities', opportunityId);
      const nowIso = new Date().toISOString();
      await updateDoc(oppRef, {
        status: 'viewed',
        viewedAt: nowIso,
        updatedAt: nowIso,
      });
    }
  },

  /**
   * Professional passes on an opportunity
   */
  async passOpportunity(
    opportunityId: string,
    professionalId: string,
    passReason: PassReason,
    passNote?: string
  ): Promise<void> {
    const opp = await this.getOpportunity(opportunityId, professionalId);
    if (!opp) {
      throw new Error(`Opportunity ${opportunityId} not found.`);
    }

    if (opp.status === 'passed' || opp.status === 'interested' || opp.status === 'alternative_proposal') {
      throw new Error('This opportunity has already been responded to.');
    }

    if (new Date(opp.expiresAt) < new Date()) {
      throw new Error('This opportunity has expired and cannot be responded to.');
    }

    const nowIso = new Date().toISOString();
    const oppRef = doc(db, 'opportunities', opportunityId);

    // 1. Update opportunity status
    await updateDoc(oppRef, {
      status: 'passed',
      respondedAt: nowIso,
      responseType: 'pass',
      passReason,
      passNote: passNote || '',
      updatedAt: nowIso,
    });

    // 2. Update match status
    if (opp.matchId) {
      try {
        await matchingService.updateMatchStatus(opp.projectId, opp.matchId, 'passed');
      } catch (err: any) {
        console.warn('[opportunityService] Notice updating match candidate status on pass:', err.message);
      }
    }

    // 3. Log activity
    await projectService.logActivity(
      opp.projectId,
      professionalId,
      'professional',
      'opportunity_passed',
      'Professional passed on brief',
      'A matched professional indicated they cannot take on this scope at this time.',
      { opportunityId, passReason }
    );

    // 4. Audit
    await auditService.logEvent(
      professionalId,
      'professional',
      'OPPORTUNITY_PASSED',
      'opportunity',
      opportunityId,
      { projectId: opp.projectId, passReason }
    );
  },

  /**
   * Get all opportunities for a project (Admin)
   */
  async getOpportunitiesForProject(projectId: string): Promise<Opportunity[]> {
    const q = query(
      collection(db, 'opportunities'),
      where('projectId', '==', projectId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Opportunity);
    return this.checkAndMarkExpired(list);
  },

  /**
   * Helper to evaluate expiry in real time
   */
  checkAndMarkExpired(opportunities: Opportunity[]): Opportunity[] {
    const now = new Date();
    return opportunities.map((opp) => {
      if ((opp.status === 'pending' || opp.status === 'viewed') && new Date(opp.expiresAt) < now) {
        return {
          ...opp,
          status: 'expired',
        };
      }
      return opp;
    });
  },
};
