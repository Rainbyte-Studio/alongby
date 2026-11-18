import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read Firebase applet configuration
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('Missing firebase-applet-config.json file.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export const DEMO_PASSWORD = 'alongby123';

export const DEMO_USERS = {
  admin: {
    email: 'demo.admin@alongby.example',
    password: DEMO_PASSWORD,
    displayName: 'Demo Admin',
    role: 'admin' as const,
  },
  client: {
    email: 'demo.client@alongby.example',
    password: DEMO_PASSWORD,
    displayName: 'Demo Client',
    role: 'client' as const,
    companyName: 'Apex Studio & Co',
    companyWebsite: 'https://apexstudio.example',
    country: 'United Kingdom',
    timezone: 'Europe/London',
  },
  client2: {
    email: 'demo.client2@alongby.example',
    password: DEMO_PASSWORD,
    displayName: 'Client Beta Corp',
    role: 'client' as const,
    companyName: 'Beta Holdings Ltd',
    companyWebsite: 'https://betaholdings.example',
    country: 'Germany',
    timezone: 'Europe/Berlin',
  },
  professional: {
    email: 'demo.professional@alongby.example',
    password: DEMO_PASSWORD,
    displayName: 'Demo Professional',
    role: 'professional' as const,
    professionalTitle: 'Principal Full-Stack Engineer & Product Architect',
    shortBio:
      'Senior digital artisan specializing in high-performance web platforms, TypeScript architecture, and bespoke product development.',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    languages: ['English', 'French'],
    primaryServices: ['Web Development', 'UI/UX Design', 'System Architecture'],
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Firebase', 'Next.js'],
    yearsOfExperience: 10,
    minimumBudgetMinor: 500000, // £5,000.00
    currency: 'GBP',
    completedProjectCount: 12,
    averageRating: 4.95,
    industries: ['Technology', 'Creative Agencies', 'FinTech', 'E-Commerce'],
    preferredProjectTypes: ['Bespoke Web Applications', 'Design Systems', 'Full-Stack Platforms'],
    portfolioItems: [
      {
        id: 'portfolio-1',
        title: 'Zenith Commerce',
        description: 'High-conversion headless storefront built with Next.js and Tailwind CSS.',
        projectType: 'E-Commerce',
        skills: ['React', 'TypeScript', 'Tailwind CSS'],
        industry: 'E-Commerce',
        year: '2025',
      },
      {
        id: 'portfolio-2',
        title: 'Verve Design System',
        description: 'Enterprise component library and accessible design token ecosystem.',
        projectType: 'Design System',
        skills: ['TypeScript', 'React', 'CSS'],
        industry: 'Technology',
        year: '2025',
      },
    ],
    availabilityStatus: 'available' as const,
    nextAvailableDate: '2026-09-15',
    maximumConcurrentProjects: 3,
    currentActiveProjectCount: 1,
  },
  professional2: {
    email: 'demo.professional2@alongby.example',
    password: DEMO_PASSWORD,
    displayName: 'Elena Rostova',
    role: 'professional' as const,
    professionalTitle: 'Principal UI/UX Designer & Design Systems Lead',
    shortBio:
      'Crafting meticulous design systems, accessible interface architecture, and high-conversion SaaS user experiences.',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    languages: ['English', 'German'],
    primaryServices: ['UI/UX Design', 'Design Systems & Prototyping', 'Web Development'],
    skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Tailwind CSS', 'React', 'TypeScript'],
    yearsOfExperience: 8,
    minimumBudgetMinor: 400000, // €4,000.00
    currency: 'EUR',
    completedProjectCount: 16,
    averageRating: 4.98,
    industries: ['FinTech', 'Technology', 'Healthcare', 'Creative Agencies'],
    preferredProjectTypes: ['Design Systems', 'Bespoke Web Applications', 'Mobile Applications (iOS / Android)'],
    portfolioItems: [
      {
        id: 'portfolio-er-1',
        title: 'Aura Health UI',
        description: 'Design system and accessible dashboard for healthcare tele-analytics.',
        projectType: 'Design Systems',
        skills: ['Figma', 'Design Systems', 'UI/UX Design'],
        industry: 'Healthcare',
        year: '2025',
      },
    ],
    availabilityStatus: 'available' as const,
    nextAvailableDate: '2026-09-20',
    maximumConcurrentProjects: 2,
    currentActiveProjectCount: 0,
  },
  professional3: {
    email: 'demo.professional3@alongby.example',
    password: DEMO_PASSWORD,
    displayName: 'Marcus Vance',
    role: 'professional' as const,
    professionalTitle: 'Senior Cloud & Systems Architect',
    shortBio:
      'Specializing in robust backend infrastructure, resilient API design, and distributed cloud applications.',
    country: 'Netherlands',
    timezone: 'Europe/Amsterdam',
    languages: ['English', 'Dutch'],
    primaryServices: ['Web Development', 'System Architecture', 'Technical Architecture & APIs'],
    skills: ['Node.js', 'TypeScript', 'Firebase', 'React', 'System Architecture', 'APIs'],
    yearsOfExperience: 12,
    minimumBudgetMinor: 450000, // €4,500.00
    currency: 'EUR',
    completedProjectCount: 22,
    averageRating: 4.92,
    industries: ['Technology', 'E-Commerce', 'Logistics'],
    preferredProjectTypes: ['Full-Stack Platforms', 'Bespoke Web Applications'],
    portfolioItems: [
      {
        id: 'portfolio-mv-1',
        title: 'Nexus Data Pipeline',
        description: 'Scalable serverless API gateway with real-time stream aggregation.',
        projectType: 'Architecture',
        skills: ['TypeScript', 'Node.js', 'System Architecture'],
        industry: 'Technology',
        year: '2025',
      },
    ],
    availabilityStatus: 'available' as const,
    nextAvailableDate: '2026-09-18',
    maximumConcurrentProjects: 3,
    currentActiveProjectCount: 1,
  },
};

/**
 * Ensures a Firebase Auth user exists with the designated email & password.
 */
async function getOrCreateUser(email: string, pass: string, displayName: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    console.log(`[Auth] User already exists & signed in: ${email} (${cred.user.uid})`);
    return cred.user;
  } catch (err: any) {
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/invalid-login-credentials'
    ) {
      console.log(`[Auth] User not found. Creating new Firebase Auth user: ${email}...`);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName });
      console.log(`[Auth] User created successfully: ${email} (${cred.user.uid})`);
      return cred.user;
    }
    throw err;
  }
}

/**
 * Main seeding execution
 */
export async function seedDemoAccounts() {
  console.log('--- Alongby Development Demo Accounts Provisioning ---');
  const nowIso = new Date().toISOString();

  // 1. Ensure all Firebase Auth accounts exist
  console.log('\n1. Ensuring Firebase Auth users exist...');
  const adminUser = await getOrCreateUser(
    DEMO_USERS.admin.email,
    DEMO_USERS.admin.password,
    DEMO_USERS.admin.displayName
  );

  const clientUser = await getOrCreateUser(
    DEMO_USERS.client.email,
    DEMO_USERS.client.password,
    DEMO_USERS.client.displayName
  );

  const client2User = await getOrCreateUser(
    DEMO_USERS.client2.email,
    DEMO_USERS.client2.password,
    DEMO_USERS.client2.displayName
  );

  const profUser = await getOrCreateUser(
    DEMO_USERS.professional.email,
    DEMO_USERS.professional.password,
    DEMO_USERS.professional.displayName
  );

  const prof2User = await getOrCreateUser(
    DEMO_USERS.professional2.email,
    DEMO_USERS.professional2.password,
    DEMO_USERS.professional2.displayName
  );

  const prof3User = await getOrCreateUser(
    DEMO_USERS.professional3.email,
    DEMO_USERS.professional3.password,
    DEMO_USERS.professional3.displayName
  );

  // 2. Sign in as Admin to execute authorized Firestore seeding
  console.log('\n2. Authenticating as Admin for authorized Firestore writes...');
  await signInWithEmailAndPassword(auth, DEMO_USERS.admin.email, DEMO_USERS.admin.password);
  console.log(`[Auth] Authenticated as Admin (${adminUser.uid})`);

  // Write Admin user document
  await setDoc(doc(db, 'users', adminUser.uid), {
    id: adminUser.uid,
    email: DEMO_USERS.admin.email,
    displayName: DEMO_USERS.admin.displayName,
    role: 'admin',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  console.log(`[Firestore] Admin user record synced for UID: ${adminUser.uid}`);

  // Write Client user and clientProfiles documents
  await setDoc(doc(db, 'users', clientUser.uid), {
    id: clientUser.uid,
    email: DEMO_USERS.client.email,
    displayName: DEMO_USERS.client.displayName,
    role: 'client',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await setDoc(doc(db, 'clientProfiles', clientUser.uid), {
    userId: clientUser.uid,
    fullName: DEMO_USERS.client.displayName,
    companyName: DEMO_USERS.client.companyName,
    companyWebsite: DEMO_USERS.client.companyWebsite,
    country: DEMO_USERS.client.country,
    timezone: DEMO_USERS.client.timezone,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  console.log(`[Firestore] Client user & profile synced for UID: ${clientUser.uid}`);

  // Write Client 2 (Beta) user and clientProfiles documents
  await setDoc(doc(db, 'users', client2User.uid), {
    id: client2User.uid,
    email: DEMO_USERS.client2.email,
    displayName: DEMO_USERS.client2.displayName,
    role: 'client',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await setDoc(doc(db, 'clientProfiles', client2User.uid), {
    userId: client2User.uid,
    fullName: DEMO_USERS.client2.displayName,
    companyName: DEMO_USERS.client2.companyName,
    companyWebsite: DEMO_USERS.client2.companyWebsite,
    country: DEMO_USERS.client2.country,
    timezone: DEMO_USERS.client2.timezone,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  console.log(`[Firestore] Client 2 user & profile synced for UID: ${client2User.uid}`);

  // Helper to write professional documents
  const seedProfessional = async (uid: string, data: typeof DEMO_USERS.professional | typeof DEMO_USERS.professional2 | typeof DEMO_USERS.professional3) => {
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      email: data.email,
      displayName: data.displayName,
      role: 'professional',
      accountStatus: 'active',
      onboardingStatus: 'completed',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await setDoc(doc(db, 'professionalProfiles', uid), {
      userId: uid,
      displayName: data.displayName,
      professionalTitle: data.professionalTitle,
      shortBio: data.shortBio,
      country: data.country,
      timezone: data.timezone,
      languages: data.languages,
      primaryServices: data.primaryServices,
      skills: data.skills,
      yearsOfExperience: data.yearsOfExperience,
      minimumBudgetMinor: data.minimumBudgetMinor,
      currency: data.currency,
      verificationStatus: 'verified', // Authorized by Admin
      completedProjectCount: data.completedProjectCount,
      averageRating: data.averageRating,
      industries: data.industries,
      preferredProjectTypes: data.preferredProjectTypes,
      portfolioItems: data.portfolioItems,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await setDoc(doc(db, 'availability', uid), {
      userId: uid,
      availabilityStatus: data.availabilityStatus,
      nextAvailableDate: data.nextAvailableDate,
      maximumConcurrentProjects: data.maximumConcurrentProjects,
      currentActiveProjectCount: data.currentActiveProjectCount,
      updatedAt: nowIso,
    });
    console.log(`[Firestore] Professional (${data.displayName}) synced for UID: ${uid}`);
  };

  await seedProfessional(profUser.uid, DEMO_USERS.professional);
  await seedProfessional(prof2User.uid, DEMO_USERS.professional2);
  await seedProfessional(prof3User.uid, DEMO_USERS.professional3);

  console.log('\n--- Demo Accounts Provisioning Completed Successfully ---');
  console.log('Accounts summary:');
  console.log(`- Client:         ${DEMO_USERS.client.email} / ${DEMO_PASSWORD}`);
  console.log(`- Professional 1: ${DEMO_USERS.professional.email} / ${DEMO_PASSWORD}`);
  console.log(`- Professional 2: ${DEMO_USERS.professional2.email} / ${DEMO_PASSWORD}`);
  console.log(`- Professional 3: ${DEMO_USERS.professional3.email} / ${DEMO_PASSWORD}`);
  console.log(`- Admin:          ${DEMO_USERS.admin.email} / ${DEMO_PASSWORD}`);
}

// If invoked directly from CLI
seedDemoAccounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error seeding demo accounts:', err);
    process.exit(1);
  });
