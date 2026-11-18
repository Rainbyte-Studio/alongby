import {
  Project,
  ProfessionalProfile,
  ProfessionalAvailability,
  Quote,
} from '../types';

export const matchExplanationService = {
  /**
   * Generates a polished, deterministic, client-safe explanation for why this professional was matched.
   * STRICTLY NO RAW SCORES (e.g. no "94% Match" or "AI score 88").
   */
  generateClientSafeExplanation(
    project: Project,
    professional: ProfessionalProfile,
    availability: ProfessionalAvailability | null,
    quote: Quote,
    internalReasons: string[] = []
  ): string {
    const serviceName = project.serviceId ? project.serviceId.replace(/_/g, ' ') : 'digital';
    const yoe = professional.yearsOfExperience || 0;
    const completed = professional.completedProjectCount || 0;

    // Pick top matched skills
    const projectFeatures = (project.brief?.features || []).map((f) => f.toLowerCase());
    const matchedSkills = (professional.skills || []).filter((s) =>
      projectFeatures.some((feat) => feat.includes(s.toLowerCase()) || s.toLowerCase().includes(feat))
    );

    const parts: string[] = [];

    // Experience statement
    if (yoe >= 8) {
      parts.push(`Senior specialist with over ${yoe} years of verified experience in ${serviceName}`);
    } else if (yoe >= 4) {
      parts.push(`Verified specialist with ${yoe} years of hands-on expertise in ${serviceName}`);
    } else {
      parts.push(`Verified practitioner specializing in ${serviceName}`);
    }

    // Skills / deliverables alignment
    if (matchedSkills.length >= 2) {
      parts.push(`proven delivery in ${matchedSkills.slice(0, 2).join(' and ')}`);
    } else if (completed >= 3) {
      parts.push(`a track record of ${completed} successfully delivered marketplace projects`);
    }

    // Availability & schedule alignment
    if (availability?.availabilityStatus === 'available') {
      parts.push('immediate capacity aligned with your desired kickoff date');
    } else if (quote.proposedStartDate) {
      parts.push(`readiness to begin on ${quote.proposedStartDate}`);
    }

    if (parts.length === 0) {
      return `Matched for proven specialty in ${serviceName} and alignment with your project requirements.`;
    }

    if (parts.length === 1) {
      return `Selected for ${parts[0]}.`;
    }

    if (parts.length === 2) {
      return `Selected for ${parts[0]}, with ${parts[1]}.`;
    }

    return `Selected for ${parts[0]}, ${parts[1]}, and ${parts[2]}.`;
  },

  /**
   * Generates 2-3 clean bullet highlights for the client comparison cards
   */
  extractKeyHighlights(
    project: Project,
    professional: ProfessionalProfile,
    availability: ProfessionalAvailability | null,
    quote: Quote
  ): string[] {
    const highlights: string[] = [];

    // 1. Experience & Delivery Track Record
    if (professional.completedProjectCount && professional.completedProjectCount >= 3) {
      highlights.push(
        `${professional.completedProjectCount} verified marketplace deliveries with a ${professional.averageRating ? professional.averageRating.toFixed(1) + '★' : 'top'} client satisfaction rating`
      );
    } else if (professional.yearsOfExperience) {
      highlights.push(
        `${professional.yearsOfExperience}+ years professional practice in ${professional.professionalTitle || 'digital crafts'}`
      );
    }

    // 2. Timeline & Kickoff
    if (quote.proposedStartDate) {
      highlights.push(
        `Ready to commence on ${quote.proposedStartDate} (${quote.estimatedDurationDays} days estimated turnaround)`
      );
    } else if (availability?.availabilityStatus === 'available') {
      highlights.push('Immediate kickoff availability aligned with target timeline');
    }

    // 3. Deliverable & Inclusions
    if (quote.includedItems && quote.includedItems.length > 0) {
      highlights.push(
        `Comprehensive scope including ${quote.includedItems.slice(0, 2).join(' & ')} with ${quote.revisionsIncluded} revision rounds`
      );
    } else if (quote.quoteType === 'alternative') {
      highlights.push('Customized scope structure tailored to project goals');
    }

    return highlights.slice(0, 3);
  },
};
