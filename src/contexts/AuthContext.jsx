import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth, usingAuthEmulator } from '../firebase/config';
import { ensureUserDocument, subscribeToUserDocument } from '../services/users';
import { subscribeSimulationConfig } from '../services/simulation';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(true);

  const signInWithGoogle = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    if (usingAuthEmulator) {
      await signInWithRedirect(auth, provider);
      return;
    }
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    setAuthError('');
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error(err);
      setAuthError('No se pudo completar el inicio de sesión. Intentá de nuevo.');
    });

    let profileUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      setCurrentUser(user);

      if (!user) {
        setUserProfile(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        await ensureUserDocument(user);

        profileUnsubscribe = subscribeToUserDocument(
          user.uid,
          (profile) => {
            setUserProfile(profile);
            setProfileLoading(false);
            setLoading(false);
          },
          (err) => {
            console.error(err);
            setAuthError('No se pudo cargar tu perfil.');
            setProfileLoading(false);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error(err);
        setAuthError('No se pudo crear o cargar tu perfil.');
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeSimulationConfig(
      (config) => {
        setSimulationMode(config?.simulationMode ?? false);
        setSimulationLoading(false);
      },
      (error) => {
        console.error('subscribeSimulationConfig error:', error.code, error.message);
        setSimulationMode(false);
        setSimulationLoading(false);
      }
    );
    return unsub;
  }, []);

  const status = userProfile?.status ?? null;
  const isAdmin = Boolean(userProfile?.isAdmin);

  const value = {
    currentUser,
    userProfile,
    status,
    isAdmin,
    simulationMode,
    simulationLoading,
    signInWithGoogle,
    logout,
    loading,
    profileLoading,
    authError,
    clearAuthError: () => setAuthError(''),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
