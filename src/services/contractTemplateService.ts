import { ContractLegalSection, Proposal, ContractPartySnapshot } from '../types';

export const CONTRACT_TEMPLATE_METADATA = {
  templateVersion: 'v1.1.0-standard-commercial-template',
  termsVersion: 'v2026.1-platform-terms',
  governingLaw: 'Applicable European Union Commercial Law & Member State Jurisdiction',
  templateNotice:
    'IMPORTANT NOTICE: This agreement is a standardized commercial template provided for platform demonstration and commercial structuring. It does not constitute formal legal advice. Parties should obtain independent legal counsel review for their applicable jurisdiction.',
};

/**
 * Generates the standardized legal sections for an Alongby Master Services Contract.
 * Separates legal prose and contractual clauses from the view layer.
 */
export function generateContractLegalSections(
  proposal: Proposal,
  client: ContractPartySnapshot,
  professional: ContractPartySnapshot,
  contractNumber: string
): ContractLegalSection[] {
  const currency = proposal.commercialTerms.currency;
  const totalFormatted = `${(proposal.commercialTerms.totalAmountMinor / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
  const phase1Formatted = `${(proposal.commercialTerms.phase1AmountMinor / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
  const phase2Formatted = `${(proposal.commercialTerms.phase2AmountMinor / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

  return [
    {
      id: 'template_disclaimer',
      sectionNumber: 'Notice',
      title: 'Template Agreement Status & Legal Counsel Disclaimer',
      content: CONTRACT_TEMPLATE_METADATA.templateNotice,
    },
    {
      id: 'preamble',
      sectionNumber: 'Recitals',
      title: 'Preamble & Identification of Parties',
      content: `This Master Services Contract (Agreement ref: ${contractNumber}, Template: ${CONTRACT_TEMPLATE_METADATA.templateVersion}, Terms: ${CONTRACT_TEMPLATE_METADATA.termsVersion}) is entered into and made effective as of the date of electronic execution by and between:
1. CLIENT: ${client.fullName}${client.companyName ? ` (acting on behalf of ${client.companyName})` : ''}, residing or registered in ${client.country} (hereinafter "Client"); and
2. INDEPENDENT SPECIALIST: ${professional.fullName} (${professional.companyName || 'Independent Professional'}), residing or registered in ${professional.country} (hereinafter "Specialist");
Facilitated through the Alongby platform operated by Alongby Technologies (hereinafter "Platform"). Client and Specialist may collectively be referred to as the "Parties" or individually as a "Party".

WHEREAS, Client desires to retain Specialist to provide professional digital and creative services as specified herein, and Specialist possesses the professional expertise and capacity to perform such services under the commercial terms agreed upon.`,
    },
    {
      id: 'scope_and_deliverables',
      sectionNumber: 'Section 1',
      title: 'Scope of Work & Deliverable Specifications',
      content: `1.1 Scope Summary: Specialist shall perform the services and provide the deliverables set forth in Accepted Proposal v${proposal.version}: "${proposal.title}".
1.2 Deliverables: Deliverables are structured chronologically across Phase 1 and Phase 2 milestones. Each deliverable must strictly satisfy the agreed acceptance criteria outlined in Schedule A (Schedule of Deliverables).
1.3 Exclusions: Specialist is not obligated to perform any items explicitly enumerated in the Accepted Proposal Exclusions list. Any additional work requested beyond the agreed scope shall require a formal written amendment or supplemental work order.`,
    },
    {
      id: 'commercial_and_staged_payments',
      sectionNumber: 'Section 2',
      title: 'Commercial Consideration & Staged Payment Protection',
      content: `2.1 Total Contract Consideration: Client agrees to pay Specialist a fixed total consideration of ${totalFormatted}, inclusive of all agreed services and licensing.
2.2 Configurable Staged Payment Structure:
  - Phase 1 Initial Payment (${proposal.commercialTerms.phase1Percentage}%): ${phase1Formatted}, required to be deposited under Platform Staged Payment Protection prior to project kickoff.
  - Phase 2 Final Balance (${proposal.commercialTerms.phase2Percentage}%): ${phase2Formatted}, payable upon completion, delivery, and Client inspection signoff of all Phase 2 deliverables.
2.3 Release of Held Funds: Held funds shall be released from platform payment protection to the Specialist's disbursement account only upon explicit client milestone approval or expiration of the formal inspection period without dispute. Alongby acts as a technology workflow platform facilitating commercial milestone holds and does not provide regulated banking or fiduciary escrow services.`,
    },
    {
      id: 'acceptance_and_revisions',
      sectionNumber: 'Section 3',
      title: 'Inspection Period, Acceptance & Revision Rights',
      content: `3.1 Review Period: Upon receipt of completed deliverables for each respective phase, Client shall have five (5) business days to review and inspect the work against the agreed acceptance criteria.
3.2 Revisions: This Agreement includes ${proposal.commercialTerms.revisionsIncluded} round(s) of reasonable revisions within the agreed scope. Revisions must be requested in writing with specific, actionable feedback.
3.3 Constructive Acceptance: If Client does not provide written notice of rejection or detailed revision requests within the 5-day review period, the deliverable shall be deemed accepted.`,
    },
    {
      id: 'intellectual_property',
      sectionNumber: 'Section 4',
      title: 'Intellectual Property Rights & Deliverable Assignment',
      content: `4.1 Assignment of Rights: Conditioned upon and immediately following full and final receipt of all consideration owed hereunder (${totalFormatted}), Specialist hereby assigns and transfers to Client all custom intellectual property rights in and to deliverables created specifically for Client under this Agreement. The Parties agree this assignment operates contractually under governing commercial law and does not presuppose the automatic application of foreign jurisdiction-specific doctrines (such as US "Work Made for Hire") unless expressly stipulated by local mandatory law.
4.2 Specialist Background IP: Specialist retains ownership of any pre-existing software, frameworks, design systems, algorithms, or tools ("Background IP"). Specialist grants Client a perpetual, irrevocable, royalty-free, non-exclusive worldwide license to use such Background IP solely as incorporated into the final deliverables.
4.3 Client Materials: Client retains exclusive ownership of all materials, logos, trademarks, and proprietary data provided to Specialist.`,
    },
    {
      id: 'confidentiality',
      sectionNumber: 'Section 5',
      title: 'Confidentiality & Non-Disclosure',
      content: `Each Party agrees to maintain in strict confidence all proprietary technical, commercial, and financial information disclosed by the other Party. Neither Party shall disclose such confidential information to any third party without prior written consent, except to professional advisors bound by equivalent obligations or as required by law.`,
    },
    {
      id: 'independent_contractor',
      sectionNumber: 'Section 6',
      title: 'Independent Contractor Relationship',
      content: `Specialist is an independent contractor, and nothing herein shall create an employer-employee, partnership, or joint venture relationship between Client and Specialist or between either Party and the Platform. Specialist remains solely responsible for all tax liabilities, social security contributions, insurance, and statutory withholdings.`,
    },
    {
      id: 'warranties_and_liability',
      sectionNumber: 'Section 7',
      title: 'Warranties & Limitation of Liability',
      content: `7.1 Specialist Warranty: Specialist warrants that all deliverables shall be original work, will not infringe upon third-party intellectual property rights, and will be executed in a professional, workmanlike manner conforming to industry best practices.
7.2 Cap on Liability: To the maximum extent permitted by applicable law, neither Party's total aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable under this Agreement (${totalFormatted}). In no event shall either Party be liable for indirect, incidental, punitive, or consequential damages.`,
    },
    {
      id: 'dispute_resolution',
      sectionNumber: 'Section 8',
      title: 'Dispute Resolution & Platform Mediation',
      content: `In the event of any dispute or controversy arising out of this Agreement or deliverable quality, the Parties agree first to submit the matter to Alongby Platform Mediation. Both Parties agree to participate in good faith mediation for a minimum of ten (10) business days before initiating external legal proceedings.`,
    },
    {
      id: 'electronic_execution',
      sectionNumber: 'Section 9',
      title: 'Electronic Signatures & Counterparts',
      content: `This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. The Parties acknowledge and agree that electronic signatures applied hereto are intended to comply with applicable electronic transaction legislation (including Regulation (EU) No 910/2014 and the US ESIGN Act) subject to certified provider execution in production environments.`,
    },
  ];
}
