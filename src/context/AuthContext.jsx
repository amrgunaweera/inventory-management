import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  createUserProfile,
  getUserProfile,
  createOrganization,
  getMember,
  findInvitationByEmail,
  acceptInvitation,
  getOrganization,
} from '../lib/firestoreService';
import { hasPermission as checkPermission, canAccessRoute as checkRoute, ROLES } from '../lib/roles';

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
        try {
          await loadUserWithRole(firebaseUser);
        } catch (err) {
          console.error('Error loading user profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Load user profile + organization membership + role from Firestore.
   */
  const loadUserWithRole = async (firebaseUser) => {
    const profile = await getUserProfile(firebaseUser.uid);
    const orgId = profile?.organizationId || null;

    let role = null;
    let orgName = null;

    if (orgId) {
      // Fetch membership to get role
      const membership = await getMember(orgId, firebaseUser.uid);
      role = membership?.role || null;

      // Fetch org name
      const org = await getOrganization(orgId);
      orgName = org?.name || 'My Organization';
    }

    const displayName = profile?.name || firebaseUser.displayName || 'User';

    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: displayName,
      organizationId: orgId,
      orgName: orgName,
      role: role,
      roleLabel: role ? ROLES[role]?.label : null,
      avatar: displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    });
  };

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
   * Register a new user.
   * If they have a pending invitation, join that org with the invited role.
   * Otherwise, create a new organization and become admin.
   */
  const register = async (email, password, name, orgName) => {
    try {
      isRegistering.current = true;
      setLoading(true);

      // Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = credential.user;
      await updateProfile(credential.user, { displayName: name });

      // Check for a pending invitation
      const invitation = await findInvitationByEmail(email);

      let organizationId;
      let role;
      let resolvedOrgName;

      if (invitation) {
        // Accept the invitation — join existing org
        role = await acceptInvitation(invitation.orgId, invitation.inviteId, uid, { name, email });
        organizationId = invitation.orgId;
        resolvedOrgName = invitation.orgName;

        // Create user profile pointing to the org
        await createUserProfile(uid, { name, email, organizationId });
      } else {
        // No invitation — create a new org and become admin
        await createUserProfile(uid, { name, email, organizationId: null });
        organizationId = await createOrganization(uid, {
          name: orgName || 'My Organization',
          userName: name,
          userEmail: email,
        });
        role = 'admin';
        resolvedOrgName = orgName || 'My Organization';
      }

      const displayName = name || 'User';
      setUser({
        uid,
        email,
        name: displayName,
        organizationId,
        orgName: resolvedOrgName,
        role,
        roleLabel: ROLES[role]?.label || role,
        avatar: displayName
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

  // ─── Permission Helpers (derived from user.role) ─────────────────────────────

  const hasPermission = useCallback(
    (permission) => {
      return checkPermission(user?.role, permission);
    },
    [user?.role]
  );

  const canAccess = useCallback(
    (route) => {
      return checkRoute(user?.role, route);
    },
    [user?.role]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        hasPermission,
        canAccess,
      }}
    >
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
