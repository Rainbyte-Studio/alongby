# Alongby — Development Demo Accounts & Provisioning Strategy

This document outlines the evaluation accounts, provisioning pipeline, and role authorization architecture for **Alongby**.

---

## 1. Demo User Matrix

The application provides three dedicated demo accounts designed exclusively for development and testing:

| Role | Email | Development Password | Initial State | Primary Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | `demo.client@alongby.example` | `alongby123` | Onboarded, Active Profile (`Apex Studio & Co`) | `/client` |
| **Professional** | `demo.professional@alongby.example` | `alongby123` | Onboarded, Verified Profile, Available Capacity | `/professional` |
| **Admin** | `demo.admin@alongby.example` | `alongby123` | Onboarded, Securely Authorized Admin | `/admin` |

---

## 2. Security Architecture & Role Isolation

1. **Zero Self-Promotion**: The frontend application and unprivileged users cannot assign or elevate their own role to `admin`. The Firestore Security Rules strictly reject any user creation or modification attempting `role == 'admin'` from unprivileged callers.
2. **Authorized Admin Check**: Administrative operations are governed by `isAdmin()` in `firestore.rules`:
   ```javascript
   function isAdmin() {
     return isAuthenticated() && (
       (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin') ||
       request.auth.token.admin == true ||
       request.auth.token.email == 'demo.admin@alongby.example'
     );
   }
   ```
3. **Role Guards**:
   - `RoleGuard` prevents cross-role route leakage (e.g. Clients attempting to view `/admin` or `/professional` are safely intercepted and redirected to their respective dashboard).
   - `ProtectedRoute` ensures users with pending onboarding complete profile requirements before entering the main app.

---

## 3. Provisioning & Seeding Strategy

A reusable server/CLI script is provided to safely initialize or refresh demo users without manual Firebase console interaction:

```bash
# Provision or update all 3 demo users and their corresponding Firestore records:
npm run seed:demo

# Validate authentication and Firestore document consistency:
npm run verify:demo
```

### Seeding Implementation Details (`scripts/seedDemoAccounts.ts`)

- **Firebase Authentication**: Checks if each user exists; if missing, registers them via Firebase Auth with the designated development password.
- **Admin Elevation**: Signs in as the admin account to ensure `isAdmin()` rules apply.
- **Client Document**: Populates `users/{clientUid}` (`role: 'client'`, `onboardingStatus: 'completed'`) and `clientProfiles/{clientUid}` (`companyName: 'Apex Studio & Co'`).
- **Professional Document**: Populates `users/{profUid}` (`role: 'professional'`, `onboardingStatus: 'completed'`), `professionalProfiles/{profUid}` (`verificationStatus: 'verified'`, portfolio items, skills, rating), and `availability/{profUid}` (`availabilityStatus: 'available'`).
- **Admin Document**: Populates `users/{adminUid}` (`role: 'admin'`, `onboardingStatus: 'completed'`).

---

## 4. Manual Firebase Console Setup (Fallback)

If automated provisioning cannot be run, accounts may be manually configured in the Firebase Console:

1. **Firebase Authentication**:
   - Go to **Authentication > Users** in the Firebase Console.
   - Click **Add User** and create:
     - `demo.client@alongby.example` with password `alongby123`
     - `demo.professional@alongby.example` with password `alongby123`
     - `demo.admin@alongby.example` with password `alongby123`
2. **Firestore Database**:
   - In the `users` collection, create or verify document ID matching each user's UID:
     - For Admin: `{ "id": "<ADMIN_UID>", "email": "demo.admin@alongby.example", "role": "admin", "onboardingStatus": "completed", "accountStatus": "active" }`
     - For Client: `{ "id": "<CLIENT_UID>", "email": "demo.client@alongby.example", "role": "client", "onboardingStatus": "completed", "accountStatus": "active" }`
     - For Professional: `{ "id": "<PROF_UID>", "email": "demo.professional@alongby.example", "role": "professional", "onboardingStatus": "completed", "accountStatus": "active" }`
   - In `professionalProfiles`, set `<PROF_UID>` with `verificationStatus: "verified"`.
