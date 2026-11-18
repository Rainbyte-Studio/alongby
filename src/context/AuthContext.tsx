import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { availabilityService } from '../services/availabilityService';
import {
  UserProfile,
  ClientProfile,
  ProfessionalProfile,
  ProfessionalAvailability,
  UserRole,
} from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  clientProfile: ClientProfile | null;
  professionalProfile: ProfessionalProfile | null;
  availability: ProfessionalAvailability | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  signOut: () => Promise<void>;
  setRoleForDev: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [availability, setAvailability] = useState<ProfessionalAvailability | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserData = useCallback(async (user: FirebaseUser | null) => {
    if (!user) {
      setUserProfile(null);
      setClientProfile(null);
      setProfessionalProfile(null);
      setAvailability(null);
      setLoading(false);
      return;
    }

    try {
      const uProfile = await authService.getUserProfile(user.uid);

      if (uProfile) {
        if (uProfile.role === 'client') {
          const cProfile = await profileService.getClientProfile(user.uid);
          setUserProfile(uProfile);
          setClientProfile(cProfile);
          setProfessionalProfile(null);
          setAvailability(null);
        } else if (uProfile.role === 'professional') {
          const pProfile = await profileService.getProfessionalProfile(user.uid);
          const pAvail = await availabilityService.getAvailability(user.uid);
          setUserProfile(uProfile);
          setProfessionalProfile(pProfile);
          setAvailability(pAvail);
          setClientProfile(null);
        } else if (uProfile.role === 'admin') {
          // Admin may have both or neutral
          setUserProfile(uProfile);
          setClientProfile(null);
          setProfessionalProfile(null);
          setAvailability(null);
        }
      } else {
        setUserProfile(null);
        setClientProfile(null);
        setProfessionalProfile(null);
        setAvailability(null);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      await loadUserData(user);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  const refreshData = async () => {
    if (currentUser) {
      await loadUserData(currentUser);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await authService.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setClientProfile(null);
    setProfessionalProfile(null);
    setAvailability(null);
    setLoading(false);
  };

  const handleSetRoleForDev = async (role: UserRole) => {
    if (!currentUser) return;
    await authService.setRoleForDev(currentUser.uid, role);
    await refreshData();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        clientProfile,
        professionalProfile,
        availability,
        loading,
        refreshData,
        signOut: handleSignOut,
        setRoleForDev: handleSetRoleForDev,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
