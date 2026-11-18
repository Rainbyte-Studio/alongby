/**
 * ALONGBY TAXONOMY NORMALIZER
 * Centralized service, project type, skill, and industry normalization engine.
 * Ensures consistent canonical IDs across projects, professionals, matching, and eligibility.
 */

export type CanonicalServiceId = 'web_app' | 'website' | 'ecommerce' | 'mobile_app' | 'ui_ux';

const SERVICE_SYNONYM_MAP: Record<CanonicalServiceId, string[]> = {
  web_app: [
    'web_app',
    'webapp',
    'web-app',
    'web_application',
    'web-application',
    'web application',
    'web applications',
    'web development',
    'web-development',
    'web developer',
    'web dev',
    'full-stack',
    'fullstack',
    'full-stack development',
    'full stack',
    'full-stack engineer',
    'software engineering',
    'software engineer',
    'system architecture',
    'systems architect',
    'technical architecture & apis',
    'technical architecture',
    'fintech-web-app',
    'backend',
    'front-end',
    'frontend',
  ],
  website: [
    'website',
    'websites',
    'web_site',
    'web-site',
    'new_website',
    'website_redesign',
    'corporate website',
    'landing page',
    'landing_page',
    'web design',
    'web_design',
    'web-design',
    'web designer',
    'seo & growth engineering',
    'seo',
    'marketing website',
  ],
  ecommerce: [
    'ecommerce',
    'e_commerce',
    'e-commerce',
    'e commerce',
    'e-commerce architecture',
    'ecommerce architecture',
    'online store',
    'online_store',
    'new_store',
    'store_redesign',
    'shopify',
    'shopify plus',
    'woocommerce',
    'store',
  ],
  mobile_app: [
    'mobile_app',
    'mobileapp',
    'mobile-app',
    'mobile',
    'mobile application',
    'mobile applications',
    'mobile applications (ios / android)',
    'new_mobile',
    'mobile_mvp',
    'ios',
    'android',
    'react native',
    'react_native',
    'flutter',
  ],
  ui_ux: [
    'ui_ux',
    'ui-ux',
    'ui/ux',
    'ui ux',
    'ui/ux design',
    'ui ux design',
    'ux/ui',
    'ux_ui',
    'ux ui',
    'product design',
    'product designer',
    'design systems & prototyping',
    'design systems',
    'design system',
    'design_system',
    'brand identity & systems',
    'brand identity',
    'brand design',
    'brand_design',
    'visual design',
    'ux design',
    'ui design',
  ],
};

const SKILL_SYNONYM_MAP: Record<string, string[]> = {
  react: ['react', 'react.js', 'reactjs', 'react-js'],
  typescript: ['typescript', 'ts', 'type-script'],
  javascript: ['javascript', 'js', 'es6', 'ecmascript'],
  nodejs: ['nodejs', 'node.js', 'node', 'node-js'],
  tailwind: ['tailwind css', 'tailwind', 'tailwindcss', 'tailwind-css'],
  nextjs: ['next.js', 'nextjs', 'next', 'next-js'],
  figma: ['figma', 'figma design'],
  firebase: ['firebase', 'firestore', 'cloud firestore'],
  python: ['python', 'python3', 'django', 'fastapi', 'flask'],
  postgresql: ['postgresql', 'postgres', 'sql', 'relational database', 'cloud sql'],
  graphql: ['graphql', 'apollo', 'gql'],
  shopify: ['shopify', 'liquid', 'shopify plus', 'storefront api'],
  ui_ux: ['ui/ux design', 'ui/ux', 'ui design', 'ux design', 'user experience', 'user interface', 'wireframing', 'prototyping'],
  design_systems: ['design systems', 'design system', 'component library', 'design tokens'],
  system_architecture: ['system architecture', 'software architecture', 'technical architecture', 'microservices', 'apis', 'api design'],
  responsive_design: ['responsive design', 'responsive_design', 'mobile responsive', 'responsive web', 'responsive web design'],
  seo: ['seo', 'search engine optimization', 'seo & growth engineering', 'growth engineering'],
  mobile_dev: ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
};

const INDUSTRY_SYNONYM_MAP: Record<string, string[]> = {
  fintech: ['fintech', 'fin-tech', 'financial services', 'finance', 'banking', 'crypto', 'payments'],
  technology: ['technology', 'tech', 'software', 'saas', 'b2b', 'cloud', 'ai', 'it'],
  ecommerce: ['ecommerce', 'e-commerce', 'e commerce', 'retail', 'consumer goods', 'dtc', 'shop'],
  healthcare: ['healthcare', 'health', 'medtech', 'health & wellness', 'wellness', 'biotech'],
  creative: ['creative agencies', 'creative agency', 'creative', 'design agency', 'marketing', 'media', 'advertising'],
  education: ['education', 'edtech', 'learning', 'e-learning', 'academic'],
  logistics: ['logistics', 'supply chain', 'transportation', 'delivery', 'freight'],
  professional_services: ['professional services', 'consulting', 'legal', 'accounting', 'real estate'],
};

function cleanString(str: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[/-]/g, ' ')
    .replace(/\s+/g, ' ');
}

export const taxonomyNormalizer = {
  /**
   * Normalizes any service identifier, display label, slug, or title into a canonical service ID.
   */
  normalizeServiceId(serviceRaw?: string): CanonicalServiceId | string {
    if (!serviceRaw) return 'web_app';
    const clean = cleanString(serviceRaw);

    for (const [canonicalId, synonyms] of Object.entries(SERVICE_SYNONYM_MAP)) {
      for (const syn of synonyms) {
        const cleanSyn = cleanString(syn);
        if (clean === cleanSyn || clean.includes(cleanSyn) || cleanSyn.includes(clean)) {
          return canonicalId as CanonicalServiceId;
        }
      }
    }

    // Secondary heuristic fallback based on keywords
    if (clean.includes('web app') || clean.includes('saas') || clean.includes('platform') || clean.includes('portal') || clean.includes('software')) {
      return 'web_app';
    }
    if (clean.includes('site') || clean.includes('landing') || clean.includes('corporate')) {
      return 'website';
    }
    if (clean.includes('commerce') || clean.includes('shop') || clean.includes('store')) {
      return 'ecommerce';
    }
    if (clean.includes('mobile') || clean.includes('ios') || clean.includes('android')) {
      return 'mobile_app';
    }
    if (clean.includes('ui') || clean.includes('ux') || clean.includes('design') || clean.includes('figma')) {
      return 'ui_ux';
    }

    return clean.replace(/\s+/g, '_');
  },

  /**
   * Evaluates whether a professional's primary services or title align with the project's service.
   */
  isServiceCompatible(projectServiceRaw: string, profServices: string[], profTitle?: string): boolean {
    const canonicalProjService = this.normalizeServiceId(projectServiceRaw);

    // 1. Check primary services
    for (const s of profServices || []) {
      const canonicalProfService = this.normalizeServiceId(s);
      if (canonicalProfService === canonicalProjService) {
        return true;
      }
    }

    // 2. Cross-domain synergy: Web App professionals can deliver Websites; UI/UX leads can design Web Apps or Websites
    if (canonicalProjService === 'website') {
      const hasWebAppOrUi = profServices.some((s) => {
        const c = this.normalizeServiceId(s);
        return c === 'web_app' || c === 'ui_ux';
      });
      if (hasWebAppOrUi) return true;
    }

    if (canonicalProjService === 'web_app') {
      const hasWebsiteOrArch = profServices.some((s) => {
        const c = this.normalizeServiceId(s);
        return c === 'web_app' || c === 'website';
      });
      if (hasWebsiteOrArch) return true;
    }

    // 3. Check professional title as additional evidence
    if (profTitle) {
      const canonicalTitleService = this.normalizeServiceId(profTitle);
      if (canonicalTitleService === canonicalProjService) {
        return true;
      }
    }

    return false;
  },

  /**
   * Normalizes a technical skill string to its canonical skill identifier.
   */
  normalizeSkill(skillRaw: string): string {
    if (!skillRaw) return '';
    const clean = cleanString(skillRaw);

    for (const [canonicalSkill, synonyms] of Object.entries(SKILL_SYNONYM_MAP)) {
      for (const syn of synonyms) {
        const cleanSyn = cleanString(syn);
        if (clean === cleanSyn || clean.includes(cleanSyn) || cleanSyn.includes(clean)) {
          return canonicalSkill;
        }
      }
    }

    return clean.replace(/\s+/g, '_');
  },

  /**
   * Normalizes a list of skills.
   */
  normalizeSkillList(skills: string[]): string[] {
    return Array.from(new Set((skills || []).map((s) => this.normalizeSkill(s)).filter(Boolean)));
  },

  /**
   * Calculates skill fit between project requirements (features, skills) and professional skills.
   */
  calculateSkillFit(projectSkillsOrFeatures: string[], profSkills: string[]): {
    overlapCount: number;
    totalRequired: number;
    matchingSkills: string[];
    fitRatio: number;
  } {
    const normalizedProj = this.normalizeSkillList(projectSkillsOrFeatures);
    const normalizedProf = this.normalizeSkillList(profSkills);

    if (normalizedProj.length === 0) {
      return {
        overlapCount: normalizedProf.length > 0 ? 1 : 0,
        totalRequired: 0,
        matchingSkills: normalizedProf.slice(0, 3),
        fitRatio: 1,
      };
    }

    const matches = normalizedProj.filter((s) => normalizedProf.includes(s));
    return {
      overlapCount: matches.length,
      totalRequired: normalizedProj.length,
      matchingSkills: matches,
      fitRatio: matches.length / normalizedProj.length,
    };
  },

  /**
   * Normalizes an industry string to its canonical identifier.
   */
  normalizeIndustry(industryRaw?: string): string {
    if (!industryRaw) return 'technology';
    const clean = cleanString(industryRaw);

    for (const [canonicalInd, synonyms] of Object.entries(INDUSTRY_SYNONYM_MAP)) {
      for (const syn of synonyms) {
        const cleanSyn = cleanString(syn);
        if (clean === cleanSyn || clean.includes(cleanSyn) || cleanSyn.includes(clean)) {
          return canonicalInd;
        }
      }
    }

    return clean.replace(/\s+/g, '_');
  },

  /**
   * Normalizes a list of industries.
   */
  normalizeIndustryList(industries: string[]): string[] {
    return Array.from(new Set((industries || []).map((i) => this.normalizeIndustry(i)).filter(Boolean)));
  },

  /**
   * Normalizes an amount into minor units (cents).
   * Prevents mismatch bugs like 350000 vs 3000 by safely scaling values under 500.
   */
  normalizeBudgetMinor(val: number | null | undefined): number {
    if (val === null || val === undefined || isNaN(val)) return 0;
    const num = Math.round(Number(val));
    if (num <= 0) return 0;
    // If entered as whole currency units (e.g. €3,000 instead of 300,000 minor units)
    if (num < 10000) {
      return num * 100;
    }
    return num;
  },
};
