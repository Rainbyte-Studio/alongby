import {
  ServiceCategory,
  IndustryOption,
  ProjectGoalOption,
  ExistingAssetOption,
  BudgetRangeOption,
} from '../types';

/**
 * Alongby Service Taxonomy Configuration
 * Designed as a decoupled configuration layer so administrators can manage
 * or seed taxonomy in Firestore later without altering UI components.
 */

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'website',
    slug: 'website',
    name: 'Website',
    description: 'Bespoke corporate websites, high-converting landing pages, and portfolio showcases.',
    active: true,
    sortOrder: 1,
    projectTypes: [
      { id: 'new_website', slug: 'new_website', name: 'New Website', description: 'Complete design and build from the ground up' },
      { id: 'website_redesign', slug: 'website_redesign', name: 'Website Redesign', description: 'Overhaul visual aesthetic, performance, and structure' },
      { id: 'landing_page', slug: 'landing_page', name: 'Landing Page', description: 'High-converting single page for a campaign, launch, or product' },
      { id: 'website_improvements', slug: 'website_improvements', name: 'Existing Website Improvements', description: 'Targeted additions, speed optimizations, or bug fixes' },
      { id: 'website_other', slug: 'website_other', name: 'Other Website Project', description: 'Specific custom requirements' },
    ],
    featureOptions: [
      { id: 'responsive_design', name: 'Responsive design (Mobile / Tablet / Desktop)', recommended: true },
      { id: 'cms', name: 'Content Management System (CMS)' },
      { id: 'contact_forms', name: 'Interactive contact / inquiry forms' },
      { id: 'blog', name: 'Editorial blog / articles section' },
      { id: 'multilingual', name: 'Multilingual / localization support' },
      { id: 'booking', name: 'Appointment booking / scheduling integration' },
      { id: 'user_accounts', name: 'Client / user portal authentication' },
      { id: 'newsletter', name: 'Newsletter & marketing automation capture' },
      { id: 'analytics', name: 'Privacy-first analytics & conversion tracking' },
      { id: 'seo_setup', name: 'Technical SEO foundation & schema markup' },
      { id: 'custom_animations', name: 'Custom micro-interactions & motion design' },
      { id: 'other', name: 'Other custom feature' },
    ],
  },
  {
    id: 'ecommerce',
    slug: 'ecommerce',
    name: 'E-commerce',
    description: 'Custom digital storefronts, Shopify or WooCommerce setups, and catalog sales engines.',
    active: true,
    sortOrder: 2,
    projectTypes: [
      { id: 'new_store', slug: 'new_store', name: 'New Online Store', description: 'Brand new e-commerce storefront with checkout' },
      { id: 'store_redesign', slug: 'store_redesign', name: 'Store Redesign', description: 'Modernize catalog UX and conversion funnel' },
      { id: 'store_migration', slug: 'store_migration', name: 'Store Migration', description: 'Migrate products and customers between e-commerce platforms' },
      { id: 'store_improvements', slug: 'store_improvements', name: 'Store Optimization & Improvements', description: 'Checkout friction reduction, speed, and apps' },
      { id: 'ecommerce_other', slug: 'ecommerce_other', name: 'Other E-commerce Project', description: 'Custom marketplace or headless storefront' },
    ],
    featureOptions: [
      { id: 'product_catalog', name: 'Structured product catalog & categorisation', recommended: true },
      { id: 'product_variations', name: 'Product variations (sizes, colors, bundles)' },
      { id: 'shopping_cart', name: 'Cart & persistent customer sessions' },
      { id: 'checkout', name: 'Frictionless checkout & tax calculation' },
      { id: 'payment_gateways', name: 'Payment gateways (Stripe, Apple Pay, PayPal)' },
      { id: 'shipping_config', name: 'Automated carrier rates & shipping zones' },
      { id: 'discount_codes', name: 'Promo codes, vouchers & tiered discounts' },
      { id: 'customer_accounts', name: 'Customer account dashboard & order history' },
      { id: 'product_filtering', name: 'Faceted product filtering & search' },
      { id: 'reviews_ratings', name: 'Customer reviews & social proof integration' },
      { id: 'multicurrency', name: 'Multi-currency & geo-pricing' },
      { id: 'inventory_sync', name: 'Inventory management & ERP/POS sync' },
      { id: 'other', name: 'Other custom e-commerce feature' },
    ],
  },
  {
    id: 'web_app',
    slug: 'web_app',
    name: 'Web Application',
    description: 'Custom software, SaaS platforms, portals, and cloud dashboards.',
    active: true,
    sortOrder: 3,
    projectTypes: [
      { id: 'new_webapp', slug: 'new_webapp', name: 'New Web App', description: 'End-to-end full-stack web application' },
      { id: 'mvp', slug: 'mvp', name: 'Minimum Viable Product (MVP)', description: 'Fast, focused launch of core product value' },
      { id: 'app_redesign', slug: 'app_redesign', name: 'Existing App Redesign', description: 'Frontend visual & architectural modernization' },
      { id: 'feature_development', slug: 'feature_development', name: 'New Feature Development', description: 'Add specific capabilities to an existing software stack' },
      { id: 'webapp_other', slug: 'webapp_other', name: 'Other Web App Project', description: 'Bespoke backend, data pipeline, or integration' },
    ],
    featureOptions: [
      { id: 'auth_rbac', name: 'Authentication & Role-Based Access Control (RBAC)', recommended: true },
      { id: 'dashboard_ui', name: 'Analytical dashboard & metrics' },
      { id: 'database_crud', name: 'Relational / document database architecture' },
      { id: 'api_integrations', name: 'Third-party API & webhook integrations' },
      { id: 'billing_subscriptions', name: 'Subscription billing & invoice generation' },
      { id: 'file_uploads', name: 'Cloud asset storage & processing' },
      { id: 'realtime_notifications', name: 'Real-time updates & notifications' },
      { id: 'search_filters', name: 'Complex data query & export (CSV, PDF)' },
      { id: 'admin_panel', name: 'Internal administrator governance portal' },
      { id: 'security_hardening', name: 'Audit logging & compliance encryption' },
      { id: 'other', name: 'Other custom feature' },
    ],
  },
  {
    id: 'mobile_app',
    slug: 'mobile_app',
    name: 'Mobile Application',
    description: 'Native or cross-platform iOS and Android applications.',
    active: true,
    sortOrder: 4,
    projectTypes: [
      { id: 'new_mobile', slug: 'new_mobile', name: 'New Mobile App', description: 'Complete mobile build for iOS and/or Android' },
      { id: 'mobile_mvp', slug: 'mobile_mvp', name: 'Mobile MVP', description: 'Focused release for early user traction' },
      { id: 'mobile_redesign', slug: 'mobile_redesign', name: 'Existing Mobile App Redesign', description: 'Refreshed user interface and navigation' },
      { id: 'mobile_feature', slug: 'mobile_feature', name: 'New Mobile Feature', description: 'SDK integration, performance boost, or module' },
      { id: 'mobile_other', slug: 'mobile_other', name: 'Other Mobile Project', description: 'Tablet, watch, or IoT companion app' },
    ],
    featureOptions: [
      { id: 'ios_support', name: 'iOS support (iPhone & iPad)', recommended: true },
      { id: 'android_support', name: 'Android support', recommended: true },
      { id: 'user_accounts', name: 'Mobile login & biometric authentication' },
      { id: 'push_notifications', name: 'Targeted push notifications' },
      { id: 'in_app_purchases', name: 'In-app purchases & mobile subscriptions' },
      { id: 'location_maps', name: 'Geolocation, GPS & map routing' },
      { id: 'offline_mode', name: 'Offline mode with local data caching' },
      { id: 'camera_media', name: 'Camera capture & media gallery access' },
      { id: 'app_store_submission', name: 'Apple App Store & Google Play publishing setup' },
      { id: 'other', name: 'Other mobile capability' },
    ],
  },
  {
    id: 'ui_ux',
    slug: 'ui_ux',
    name: 'UI/UX Design',
    description: 'Wireframing, user research, product design systems, and visual prototyping.',
    active: true,
    sortOrder: 5,
    projectTypes: [
      { id: 'full_product_design', slug: 'full_product_design', name: 'Full Product Design', description: 'End-to-end UX architecture and polished UI mockups' },
      { id: 'website_ux_ui', slug: 'website_ux_ui', name: 'Website UX/UI Design', description: 'Figma visual design ready for developers' },
      { id: 'mobile_ux_ui', slug: 'mobile_ux_ui', name: 'Mobile App UX/UI Design', description: 'Platform-native iOS/Android component design' },
      { id: 'design_system', slug: 'design_system', name: 'Design System & Component Library', description: 'Scalable tokenized library, typography, and atoms' },
      { id: 'ux_audit', slug: 'ux_audit', name: 'UX Audit & Usability Evaluation', description: 'Heuristic analysis and conversion drop-off report' },
      { id: 'ui_ux_other', slug: 'ui_ux_other', name: 'Other Design Requirement', description: 'Bespoke design sprint' },
    ],
    featureOptions: [
      { id: 'figma_deliverables', name: 'Organized Figma source files with Auto Layout', recommended: true },
      { id: 'interactive_prototype', name: 'Clickable interactive prototype for user testing' },
      { id: 'user_flow_maps', name: 'User persona definition & journey mapping' },
      { id: 'design_system_tokens', name: 'Tokens for typography, color, spacing & radius' },
      { id: 'responsive_breakpoints', name: 'Explicit responsive desktop, tablet & mobile variants' },
      { id: 'dev_handoff_specs', name: 'Developer handoff specs, redlines & asset exports' },
      { id: 'wcag_compliance', name: 'WCAG AA accessibility color contrast audit' },
      { id: 'other', name: 'Other design asset' },
    ],
  },
  {
    id: 'branding',
    slug: 'branding',
    name: 'Branding',
    description: 'Visual identity, logo design, typography guidelines, and brand books.',
    active: true,
    sortOrder: 6,
    projectTypes: [
      { id: 'full_brand_identity', slug: 'full_brand_identity', name: 'Complete Brand Identity', description: 'Naming, logo marks, typography, color & guidelines' },
      { id: 'logo_design', slug: 'logo_design', name: 'Logo Design & Mark', description: 'Distinctive vector logo mark, variations, and icon' },
      { id: 'brand_refresh', slug: 'brand_refresh', name: 'Brand Refresh & Evolution', description: 'Modernizing legacy assets while preserving brand equity' },
      { id: 'brand_guidelines', slug: 'brand_guidelines', name: 'Brand Guidelines Manual', description: 'Definitive rules for marketing, press & product' },
      { id: 'branding_other', slug: 'branding_other', name: 'Other Branding Request', description: 'Collateral, packaging, or exhibition branding' },
    ],
    featureOptions: [
      { id: 'primary_logo', name: 'Primary logo + secondary responsive lockups', recommended: true },
      { id: 'vector_exports', name: 'Production vector files (SVG, EPS, PDF) & web formats' },
      { id: 'color_palette', name: 'Primary & secondary color palette (HEX, RGB, CMYK, Pantone)' },
      { id: 'typography_pairing', name: 'Typography pairing & font licensing recommendations' },
      { id: 'brand_book', name: 'Comprehensive Brand Book PDF' },
      { id: 'marketing_collateral', name: 'Social media templates, business cards & letterheads' },
      { id: 'iconography', name: 'Custom icon set matching brand language' },
      { id: 'other', name: 'Other branding deliverable' },
    ],
  },
  {
    id: 'digital_marketing',
    slug: 'digital_marketing',
    name: 'Digital Marketing',
    description: 'Performance marketing campaigns, social media strategy, and paid acquisition.',
    active: true,
    sortOrder: 7,
    projectTypes: [
      { id: 'growth_strategy', slug: 'growth_strategy', name: 'Growth & Acquisition Strategy', description: 'Channel audits and multi-month go-to-market plan' },
      { id: 'paid_ads_setup', slug: 'paid_ads_setup', name: 'Paid Ads Setup & Management', description: 'Google Ads, Meta, or LinkedIn campaign launch' },
      { id: 'email_marketing', slug: 'email_marketing', name: 'Email Marketing & Retention', description: 'Lifecycle flows, onboarding sequences, and newsletters' },
      { id: 'content_marketing', slug: 'content_marketing', name: 'Content Marketing Strategy', description: 'Thought leadership, blog cadence, and whitepapers' },
      { id: 'marketing_other', slug: 'marketing_other', name: 'Other Digital Marketing', description: 'Affiliate setup or influencer partnerships' },
    ],
    featureOptions: [
      { id: 'campaign_architecture', name: 'Campaign architecture & audience segmentation' },
      { id: 'conversion_tracking', name: 'Pixel & server-side conversion tracking setup' },
      { id: 'creative_copywriting', name: 'Ad creative copywriting & asset guidance' },
      { id: 'ab_testing', name: 'A/B testing framework & creative variants' },
      { id: 'performance_reporting', name: 'Executive weekly/monthly analytics dashboard' },
      { id: 'other', name: 'Other marketing deliverable' },
    ],
  },
  {
    id: 'seo',
    slug: 'seo',
    name: 'SEO',
    description: 'Technical audits, on-page optimization, content strategy, and organic authority building.',
    active: true,
    sortOrder: 8,
    projectTypes: [
      { id: 'seo_audit', slug: 'seo_audit', name: 'Comprehensive Technical SEO Audit', description: 'Crawl errors, speed, indexing, and hierarchy evaluation' },
      { id: 'on_page_seo', slug: 'on_page_seo', name: 'On-Page Optimization', description: 'Meta titles, headings, internal linking & schema markup' },
      { id: 'keyword_strategy', slug: 'keyword_strategy', name: 'Keyword Research & Content Plan', description: 'High-intent search terms and content cluster roadmap' },
      { id: 'seo_migration', slug: 'seo_migration', name: 'Website Migration SEO Safeguard', description: 'Redirect mapping and traffic preservation during relaunch' },
      { id: 'seo_other', slug: 'seo_other', name: 'Other SEO Service', description: 'Local SEO or international hreflang configuration' },
    ],
    featureOptions: [
      { id: 'technical_audit_report', name: 'Technical audit report with prioritized engineering tickets' },
      { id: 'structured_data', name: 'Schema.org JSON-LD structured data implementation' },
      { id: 'core_web_vitals', name: 'Core Web Vitals performance remediation guide' },
      { id: 'keyword_mapping', name: 'Keyword mapping table & content gap analysis' },
      { id: 'redirect_matrix', name: '301 redirect matrix for URL restructuring' },
      { id: 'other', name: 'Other SEO deliverable' },
    ],
  },
  {
    id: 'other',
    slug: 'other',
    name: 'Other Specialty',
    description: 'Custom digital projects, code audits, migrations, and niche consulting.',
    active: true,
    sortOrder: 9,
    projectTypes: [
      { id: 'custom_consulting', slug: 'custom_consulting', name: 'Technical Consulting / Advisory', description: 'Architecture review, vendor selection, or feasibility study' },
      { id: 'code_audit', slug: 'code_audit', name: 'Codebase Audit & Security Review', description: 'Performance profiling and maintainability inspection' },
      { id: 'data_migration', slug: 'data_migration', name: 'Data Pipeline or Database Migration', description: 'Transferring data between cloud systems' },
      { id: 'bespoke_other', slug: 'bespoke_other', name: 'Bespoke Engagement', description: 'Specify your requirements in the project description' },
    ],
    featureOptions: [
      { id: 'written_report', name: 'Written executive summary & technical recommendations' },
      { id: 'hands_on_implementation', name: 'Hands-on engineering or design execution' },
      { id: 'live_advisory_sessions', name: 'Scheduled live advisory sessions with leadership' },
      { id: 'documentation', name: 'Comprehensive architectural documentation' },
      { id: 'other', name: 'Other deliverables' },
    ],
  },
];

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: 'technology', name: 'Technology & Software' },
  { id: 'ecommerce_retail', name: 'E-commerce & Retail' },
  { id: 'fashion_luxury', name: 'Fashion & Luxury' },
  { id: 'food_beverage', name: 'Food & Beverage' },
  { id: 'hospitality', name: 'Hospitality & Leisure' },
  { id: 'real_estate', name: 'Real Estate & Architecture' },
  { id: 'finance', name: 'Finance & Fintech' },
  { id: 'healthcare', name: 'Healthcare & Wellness' },
  { id: 'education', name: 'Education & EdTech' },
  { id: 'professional_services', name: 'Professional Services & Legal' },
  { id: 'entertainment', name: 'Entertainment & Media' },
  { id: 'travel', name: 'Travel & Tourism' },
  { id: 'nonprofit', name: 'Nonprofit & Social Impact' },
  { id: 'other', name: 'Other Industry' },
];

export const PROJECT_GOAL_OPTIONS: ProjectGoalOption[] = [
  { id: 'launch_new', name: 'Launch a new business or product' },
  { id: 'generate_leads', name: 'Generate higher-quality business leads' },
  { id: 'increase_sales', name: 'Increase sales and direct online revenue' },
  { id: 'brand_perception', name: 'Elevate brand perception and market positioning' },
  { id: 'improve_usability', name: 'Improve user experience and customer retention' },
  { id: 'improve_conversion', name: 'Optimize conversion rate and reduce funnel drop-off' },
  { id: 'replace_outdated', name: 'Replace legacy, fragile, or slow technology' },
  { id: 'build_mvp', name: 'Validate idea with a lean Minimum Viable Product (MVP)' },
  { id: 'scale_product', name: 'Scale an existing product to handle increased volume' },
  { id: 'other', name: 'Other objective' },
];

export const EXISTING_ASSET_OPTIONS: ExistingAssetOption[] = [
  { id: 'brand_identity', name: 'Brand identity / Style guide' },
  { id: 'logo', name: 'Vector logo files' },
  { id: 'copy_content', name: 'Draft or finalized copy/text' },
  { id: 'photography', name: 'Professional photography' },
  { id: 'illustrations', name: 'Illustrations / Graphics' },
  { id: 'wireframes', name: 'Wireframes / Sketches' },
  { id: 'ui_designs', name: 'Figma / UI mockups' },
  { id: 'existing_website', name: 'Existing live website' },
  { id: 'existing_codebase', name: 'Existing codebase / Git repository' },
  { id: 'domain_hosting', name: 'Registered domain and cloud hosting' },
  { id: 'analytics', name: 'Historic analytics / Customer data' },
  { id: 'nothing_yet', name: 'Nothing yet (Starting from scratch)' },
  { id: 'other', name: 'Other existing assets' },
];

/**
 * Indicative Budget Ranges
 * Monies are strictly stored in integer minor units (cents)
 */
export const BUDGET_RANGES: BudgetRangeOption[] = [
  {
    id: 'eur_1000_2000',
    label: '€1,000 – €2,000',
    minAmountMinor: 100000,
    maxAmountMinor: 200000,
    currency: 'EUR',
  },
  {
    id: 'eur_2000_3500',
    label: '€2,000 – €3,500',
    minAmountMinor: 200000,
    maxAmountMinor: 350000,
    currency: 'EUR',
  },
  {
    id: 'eur_3500_5000',
    label: '€3,500 – €5,000',
    minAmountMinor: 350000,
    maxAmountMinor: 500000,
    currency: 'EUR',
  },
  {
    id: 'eur_5000_10000',
    label: '€5,000 – €10,000',
    minAmountMinor: 500000,
    maxAmountMinor: 1000000,
    currency: 'EUR',
  },
  {
    id: 'eur_10000_plus',
    label: '€10,000+',
    minAmountMinor: 1000000,
    maxAmountMinor: null,
    currency: 'EUR',
    openEnded: true,
  },
];

export const taxonomyService = {
  getServiceCategories(): ServiceCategory[] {
    return SERVICE_CATEGORIES.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getServiceCategoryById(id: string): ServiceCategory | undefined {
    return SERVICE_CATEGORIES.find((s) => s.id === id || s.slug === id);
  },

  getProjectTypesForService(serviceId: string) {
    const service = this.getServiceCategoryById(serviceId);
    return service ? service.projectTypes : [];
  },

  getFeaturesForService(serviceId: string) {
    const service = this.getServiceCategoryById(serviceId);
    return service ? service.featureOptions : [];
  },

  getIndustries(): IndustryOption[] {
    return INDUSTRY_OPTIONS;
  },

  getProjectGoals(): ProjectGoalOption[] {
    return PROJECT_GOAL_OPTIONS;
  },

  getExistingAssets(): ExistingAssetOption[] {
    return EXISTING_ASSET_OPTIONS;
  },

  getBudgetRanges(currency: string = 'EUR'): BudgetRangeOption[] {
    return BUDGET_RANGES.filter((r) => r.currency === currency);
  },

  formatMoneyMinor(amountMinor: number, currency: string = 'EUR'): string {
    const major = amountMinor / 100;
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  },

  /**
   * Generates a context-aware placeholder for project titles based on selected service and project type.
   * Defaults to "e.g. New company website" when no service/type is selected.
   */
  getProjectTitlePlaceholder(serviceId?: string, projectTypeId?: string): string {
    if (serviceId === 'website') {
      if (projectTypeId === 'landing_page') return 'e.g. Product launch landing page';
      if (projectTypeId === 'website_redesign') return 'e.g. Corporate website redesign';
      if (projectTypeId === 'website_improvements') return 'e.g. Website performance & speed overhaul';
      return 'e.g. New company website';
    }

    if (serviceId === 'ecommerce') {
      if (projectTypeId === 'new_store') return 'e.g. Online apparel boutique storefront';
      if (projectTypeId === 'store_redesign') return 'e.g. Direct-to-consumer store redesign';
      if (projectTypeId === 'store_migration') return 'e.g. Store migration to Shopify Plus';
      if (projectTypeId === 'store_improvements') return 'e.g. E-commerce checkout conversion optimization';
      return 'e.g. Online storefront & customer checkout';
    }

    if (serviceId === 'web_app') {
      if (projectTypeId === 'mvp') return 'e.g. SaaS MVP customer portal';
      if (projectTypeId === 'app_redesign') return 'e.g. Cloud app dashboard redesign';
      if (projectTypeId === 'feature_development') return 'e.g. Client billing & reporting module';
      return 'e.g. Custom web application & client portal';
    }

    if (serviceId === 'mobile_app') {
      if (projectTypeId === 'cross_platform') return 'e.g. Cross-platform mobile app (iOS & Android)';
      return 'e.g. Consumer iOS & Android application';
    }

    if (serviceId === 'brand_design') {
      if (projectTypeId === 'design_system') return 'e.g. Design system & component library';
      if (projectTypeId === 'brand_identity') return 'e.g. Brand identity & visual guidelines';
      return 'e.g. Comprehensive brand & design refresh';
    }

    return 'e.g. New company website';
  },
};
