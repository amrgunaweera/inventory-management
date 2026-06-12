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
  setupDemoMember,
} from '../lib/firestoreService';
import { hasPermission as checkPermission, canAccessRoute as checkRoute, ROLES } from '../lib/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);

  // Listen to Firebase Auth state changes (session restore on page load / logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip if login/register is actively managing the state
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
    let profile = await getUserProfile(firebaseUser.uid);

    // Check if user is disabled by admin
    if (profile?.status === 'disabled') {
      await signOut(auth);
      throw new Error('Your account has been deactivated by an administrator.');
    }

    // Auto-heal broken demo accounts
    if (!profile && firebaseUser.email?.includes('demo.') && firebaseUser.email?.includes('@smartventory.com')) {
      const roleKey = firebaseUser.email.split('@')[0].split('.')[1];
      let mappedRole = roleKey;
      if (roleKey === 'superadmin') mappedRole = 'super_admin';
      else if (roleKey === 'owner') mappedRole = 'store_owner';
      else if (roleKey === 'sales') mappedRole = 'store_sales_person';
      
      console.log('Auto-healing broken demo account for role:', mappedRole);
      await setupDemoMember(firebaseUser.uid, {
        email: firebaseUser.email,
        name: firebaseUser.displayName || `Demo User`,
        role: mappedRole
      });
      profile = await getUserProfile(firebaseUser.uid);
    }

    const orgId = profile?.organizationId || null;

    let role = null;
    let orgName = null;

    if (orgId) {
      // Fetch membership and org details concurrently
      const [membership, org] = await Promise.all([
        getMember(orgId, firebaseUser.uid),
        getOrganization(orgId)
      ]);
      
      role = membership?.role || null;
      orgName = org?.name || 'My Organization';

      if (org?.status === 'disabled' && role !== 'super_admin') {
        // Prevent lockout for Super Admins if their attached demo org gets disabled
        await signOut(auth);
        throw new Error('Your organization has been disabled by an administrator.');
      }
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
   * Fully loads the user profile before returning so the caller
   * can navigate immediately without race conditions.
   */
  const login = async (email, password) => {
    try {
      isRegistering.current = true;
      setLoading(true);

      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Load user profile + role before returning
      await loadUserWithRole(credential.user);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || mapAuthError(err.code) };
    } finally {
      setLoading(false);
      isRegistering.current = false;
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
        role = 'store_owner';
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

      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err.code) };
    } finally {
      setLoading(false);
      isRegistering.current = false;
    }
  };

  /**
   * Register a demo user, setting up the demo organization if needed.
   */
  const registerDemo = async (email, password, name, role) => {
    try {
      isRegistering.current = true;
      setLoading(true);

      // Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = credential.user;
      await updateProfile(credential.user, { displayName: name });

      // Setup profile & membership inside the demo organization
      await setupDemoMember(uid, { email, name, role });

      // Load fully into local memory
      await loadUserWithRole(credential.user);

      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err.code) };
    } finally {
      setLoading(false);
      isRegistering.current = false;
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
        registerDemo,
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
