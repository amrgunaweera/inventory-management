import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile, getUserProfile } from '../lib/firestoreService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isRegistering.current) {
        return;
      }
      if (firebaseUser) {
        // Augment the Firebase user with Firestore profile data
        const profile = await getUserProfile(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: profile?.name || firebaseUser.displayName || 'User',
          store: profile?.store || 'My Store',
          avatar: (profile?.name || firebaseUser.displayName || 'U')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign in an existing user with email and password.
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: mapAuthError(err.code) };
    }
  };

  /**
   * Register a new user and create their Firestore profile.
   */
  const register = async (email, password, name, store) => {
    try {
      isRegistering.current = true;
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = credential.user;

      // Set display name on Firebase Auth profile
      await updateProfile(credential.user, { displayName: name });

      // Create user document in Firestore
      await createUserProfile(uid, { name, email, store });

      setUser({
        uid,
        email,
        name,
        store,
        avatar: name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      });
      setLoading(false);
      isRegistering.current = false;
      return { success: true };
    } catch (err) {
      setLoading(false);
      isRegistering.current = false;
      return { success: false, error: mapAuthError(err.code) };
    }
  };

  /**
   * Sign out the current user.
   */
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ─── Error message mapping ────────────────────────────────────────────────────
function mapAuthError(code) {
  const errors = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return errors[code] || 'An unexpected error occurred. Please try again.';
}
