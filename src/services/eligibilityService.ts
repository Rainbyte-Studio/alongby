import {
  Project,
  ProfessionalProfile,
  ProfessionalAvailability,
  UserProfile,
  EligibilityResult,
} from '../types';
import { taxonomyNormalizer } from './taxonomyNormalizer';

/**
 * Professional Eligibility Engine
 * Enforces hard gate requirements before any professional is scored or matched.
 */
export const eligibilityService = {
  /**
   * Determine whether a professional is eligible to be considered for a project
   */
  evaluateEligibility(
    project: Project,
    professional: ProfessionalProfile,
    availability: ProfessionalAvailability | null,
    user?: UserProfile | null
  ): EligibilityResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Project Owner Check: professional cannot match with their own project
    if (project.clientId === professional.userId) {
      reasons.push('Professional is the client owner of this project.');
    }

    // 2. Base User Account Status
    if (user) {
      if (user.accountStatus === 'suspended' || user.accountStatus === 'disabled') {
        reasons.push(`Account status is ${user.accountStatus}.`);
      }
    }

    // 3. Verification Status Gate
    if (professional.verificationStatus !== 'verified') {
      reasons.push(
        `Professional profile is ${professional.verificationStatus.replace('_', ' ')} (requires verified status).`
      );
    }

    // 4. Service Category Alignment (via Canonical Taxonomy Normalizer)
    const isServiceFit = taxonomyNormalizer.isServiceCompatible(
      project.serviceId,
      professional.primaryServices || [],
      professional.professionalTitle
    );

    if (!isServiceFit) {
      const canonicalService = taxonomyNormalizer.normalizeServiceId(project.serviceId);
      reasons.push(
        `Service profile does not cover "${canonicalService.replace('_', ' ')}" engagements.`
      );
    }

    // 5. Real-Time Availability Check
    if (availability) {
      if (availability.availabilityStatus === 'unavailable') {
        reasons.push('Professional is currently unavailable (sabbatical / leave).');
      } else if (availability.availabilityStatus === 'fully_booked') {
        reasons.push('Professional is currently fully booked with existing client commitments.');
      }

      // Workload concurrent limit
      if (
        typeof availability.currentActiveProjectCount === 'number' &&
        typeof availability.maximumConcurrentProjects === 'number' &&
        availability.maximumConcurrentProjects > 0
      ) {
        if (availability.currentActiveProjectCount >= availability.maximumConcurrentProjects) {
          reasons.push(
            `Active project capacity reached (${availability.currentActiveProjectCount}/${availability.maximumConcurrentProjects} projects).`
          );
        }
      }

      // Timeline check
      if (project.brief?.timeline?.preferredStart === 'specific_date' && project.brief.timeline.startDate) {
        const reqStart = new Date(project.brief.timeline.startDate).getTime();
        const nextAvail = new Date(availability.nextAvailableDate).getTime();
        // If next available date is more than 45 days after client's required start
        const diffDays = Math.round((nextAvail - reqStart) / (1000 * 60 * 60 * 24));
        if (diffDays > 45 && project.brief.timeline.flexibility === 'fixed') {
          reasons.push(`Earliest availability date is ${diffDays} days past the required fixed start date.`);
        } else if (diffDays > 21) {
          warnings.push(`Earliest availability is ${diffDays} days after client's target start date.`);
        }
      }
    } else {
      warnings.push('No explicit availability schedule logged (assumed standard availability).');
    }

    // 6. Budget Compatibility (Normalized minor units)
    const clientMax = taxonomyNormalizer.normalizeBudgetMinor(project.brief?.budget?.maxAmountMinor);
    const profFloor = taxonomyNormalizer.normalizeBudgetMinor(professional.minimumBudgetMinor);

    if (clientMax > 0 && profFloor > 0) {
      // If client's maximum budget is less than 50% of the professional's minimum floor
      if (clientMax < profFloor * 0.5) {
        reasons.push(
          `Project budget ceiling (€${(clientMax / 100).toLocaleString()}) is significantly below professional engagement floor (€${(profFloor / 100).toLocaleString()}).`
        );
      } else if (clientMax < profFloor) {
        warnings.push(
          `Professional engagement floor (€${(profFloor / 100).toLocaleString()}) is slightly above client's indicative maximum (€${(clientMax / 100).toLocaleString()}). Alternative proposal may be requested.`
        );
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      warnings,
    };
  },
};
