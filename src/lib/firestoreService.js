/**
 * firestoreService.js
 * Centralized Firestore CRUD helpers for Smartventory.
 *
 * DATA MODEL (Organization-based multi-tenant):
 *
 *   organizations/{orgId}                — Organization root document
 *   organizations/{orgId}/members/{uid}  — Membership records (role, name, etc.)
 *   organizations/{orgId}/products/...   — Shared product catalog
 *   organizations/{orgId}/categories/... — Shared categories
 *   organizations/{orgId}/orders/...     — Shared orders
 *   organizations/{orgId}/suppliers/...  — Supplier records
 *   organizations/{orgId}/warehouses/... — Warehouse locations
 *   organizations/{orgId}/auditLog/...   — Immutable audit trail
 *   organizations/{orgId}/invitations/.. — Pending invites
 *
 *   users/{uid}                          — User profile (name, email, organizationId)
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// ─── Path helpers ─────────────────────────────────────────────────────────────

const userRef = (uid) => doc(db, 'users', uid);
const orgRef = (orgId) => doc(db, 'organizations', orgId);
const orgColRef = (orgId, col) => collection(db, 'organizations', orgId, col);
const orgDocRef = (orgId, col, id) => doc(db, 'organizations', orgId, col, id);
const memberRef = (orgId, uid) => doc(db, 'organizations', orgId, 'members', uid);

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Create a new user profile document in Firestore on first registration.
 */
export async function createUserProfile(uid, data) {
  await setDoc(userRef(uid), {
    uid,
    name: data.name || '',
    email: data.email || '',
    organizationId: data.organizationId || null,
    role: data.role || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch a user profile document once.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update specific fields on the user profile.
 */
export async function updateUserProfile(uid, updates) {
  await updateDoc(userRef(uid), { ...updates, updatedAt: serverTimestamp() });
}

/**
 * Subscribe to all users in the platform. (Super Admin only)
 */
export function subscribeToAllUsers(callback) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort in-memory to support documents lacking a createdAt field
    users.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    callback(users);
  }, (error) => {
    console.error("subscribeToAllUsers error:", error);
    callback([]);
  });
}

/**
 * Deactivate a user profile. (Super Admin only)
 * The user will be flagged as disabled and blocked via security rules.
 */
export async function deactivateUser(uid) {
  await updateDoc(userRef(uid), { 
    status: 'disabled',
    updatedAt: serverTimestamp()
  });
}

function getSecondaryAuth() {
  const name = 'AdminUserCreator';
  const app = getApps().find(a => a.name === name) || initializeApp(firebaseConfig, name);
  return getAuth(app);
}

/**
 * Create a new user in Firebase Auth and Firestore by Admin.
 */
export async function createUserByAdmin({ name, email, password, orgId, role }) {
  const secondaryAuth = getSecondaryAuth();
  
  // 1. Create Firebase Auth account
  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const uid = credential.user.uid;
  
  try {
    // 2. Sign out of secondary auth immediately to avoid lingering sessions
    await signOut(secondaryAuth);
    
    // 3. Write user profile and store assignment in Firestore using main db (batch)
    const batch = writeBatch(db);
    
    let finalOrgId = orgId || null;
    let finalRole = role || null;
    
    if (role === 'super_admin') {
      finalOrgId = null;
      finalRole = 'super_admin';
    }
    
    // Create the users/{uid} document
    batch.set(userRef(uid), {
      uid,
      name: name || '',
      email: email || '',
      organizationId: finalOrgId,
      role: finalRole,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // If assigned to a store, add to members collection
    if (finalOrgId) {
      batch.set(doc(db, 'organizations', finalOrgId, 'members', uid), {
        uid,
        name: name || '',
        email: email || '',
        role: finalRole,
        joinedAt: serverTimestamp(),
        invitedBy: null,
      });
    }
    
    await batch.commit();
    return { uid };
  } catch (err) {
    console.error('Error post-auth-creation:', err);
    throw err;
  }
}

// ─── Organization ─────────────────────────────────────────────────────────────

/**
 * Subscribe to all organizations in the platform. (Super Admin only)
 */
export function subscribeToAllOrganizations(callback) {
  const q = query(collection(db, 'organizations'));
  return onSnapshot(q, (snap) => {
    const orgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    orgs.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    callback(orgs);
  }, (error) => {
    console.error("subscribeToAllOrganizations error:", error);
    callback([]);
  });
}

/**
 * Create a new organization and set the creator as admin.
 * Returns the new organization ID.
 */
export async function createOrganization(uid, orgData) {
  const batch = writeBatch(db);

  // Create organization document
  const orgDocRef_ = doc(collection(db, 'organizations'));
  const orgId = orgDocRef_.id;

  batch.set(orgDocRef_, {
    name: orgData.name || 'My Organization',
    ownerId: uid,
    planId: 'free',
    settings: {
      currency: 'USD',
      timezone: 'UTC-5',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add creator as admin member
  const memRef = doc(db, 'organizations', orgId, 'members', uid);
  batch.set(memRef, {
    uid,
    name: orgData.userName || '',
    email: orgData.userEmail || '',
    role: 'admin',
    joinedAt: serverTimestamp(),
    invitedBy: null,
  });

  // Update user profile with org link
  batch.update(userRef(uid), {
    organizationId: orgId,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return orgId;
}

/**
 * Fetch organization document.
 */
export async function getOrganization(orgId) {
  const snap = await getDoc(orgRef(orgId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update organization settings.
 */
export async function updateOrganization(orgId, updates) {
  await updateDoc(orgRef(orgId), { ...updates, updatedAt: serverTimestamp() });
}

// ─── Members ──────────────────────────────────────────────────────────────────

/**
 * Get a member's record (including role) from an organization.
 */
export async function getMember(orgId, uid) {
  const snap = await getDoc(memberRef(orgId, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribe to real-time member list updates.
 */
export function subscribeToMembers(orgId, callback) {
  const q = query(orgColRef(orgId, 'members'), orderBy('joinedAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(members);
  });
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(orgId, uid, newRole) {
  await updateDoc(memberRef(orgId, uid), { role: newRole });
}

/**
 * Remove a member from the organization.
 */
export async function removeMember(orgId, uid) {
  const batch = writeBatch(db);
  batch.delete(memberRef(orgId, uid));
  batch.update(userRef(uid), { organizationId: null, updatedAt: serverTimestamp() });
  await batch.commit();
}

// ─── Invitations ──────────────────────────────────────────────────────────────

/**
 * Create an invitation for a new member.
 * Returns the invite ID (usable as an invite code).
 */
export async function createInvitation(orgId, { email, role, invitedBy }) {
  const ref = await addDoc(orgColRef(orgId, 'invitations'), {
    email,
    role,
    invitedBy,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Find a pending invitation by email across all orgs.
 * Returns { orgId, inviteId, role } or null.
 */
export async function findInvitationByEmail(email) {
  // Note: In production, this would use a collection group query or a top-level invites collection.
  // For now, we search all organizations' invitations.
  const orgsSnap = await getDocs(collection(db, 'organizations'));
  for (const orgDoc of orgsSnap.docs) {
    const invQ = query(
      collection(db, 'organizations', orgDoc.id, 'invitations'),
      where('email', '==', email),
      where('status', '==', 'pending'),
      limit(1)
    );
    const invSnap = await getDocs(invQ);
    if (!invSnap.empty) {
      const inv = invSnap.docs[0];
      return {
        orgId: orgDoc.id,
        orgName: orgDoc.data().name,
        inviteId: inv.id,
        role: inv.data().role,
        ...inv.data(),
      };
    }
  }
  return null;
}

/**
 * Accept an invitation: add user as member, update invite status.
 */
export async function acceptInvitation(orgId, inviteId, uid, userData) {
  const batch = writeBatch(db);

  // Get invite data
  const invRef = orgDocRef(orgId, 'invitations', inviteId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error('Invitation not found');
  const invData = invSnap.data();

  // Add as member
  batch.set(memberRef(orgId, uid), {
    uid,
    name: userData.name || '',
    email: userData.email || '',
    role: invData.role,
    joinedAt: serverTimestamp(),
    invitedBy: invData.invitedBy || null,
  });

  // Update user profile
  batch.update(userRef(uid), {
    organizationId: orgId,
    updatedAt: serverTimestamp(),
  });

  // Mark invite as accepted
  batch.update(invRef, { status: 'accepted' });

  await batch.commit();
  return invData.role;
}

/**
 * Subscribe to invitations for an organization.
 */
export function subscribeToInvitations(orgId, callback) {
  const q = query(orgColRef(orgId, 'invitations'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const invites = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(invites);
  });
}

/**
 * Delete / revoke an invitation.
 */
export async function deleteInvitation(orgId, inviteId) {
  await deleteDoc(orgDocRef(orgId, 'invitations', inviteId));
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time product updates for an organization.
 */
export function subscribeToProducts(orgId, callback) {
  const q = query(orgColRef(orgId, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(products);
  });
}

export async function addProduct(orgId, product) {
  const ref = await addDoc(orgColRef(orgId, 'products'), {
    ...product,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(orgId, productId, updates) {
  await updateDoc(orgDocRef(orgId, 'products', productId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(orgId, productId) {
  await deleteDoc(orgDocRef(orgId, 'products', productId));
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function subscribeToCategories(callback) {
  const q = query(collection(db, 'categories'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(categories);
  });
}

export async function addCategory(category) {
  const ref = await addDoc(collection(db, 'categories'), {
    ...category,
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(categoryId, updates) {
  await updateDoc(doc(db, 'categories', categoryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(categoryId) {
  await deleteDoc(doc(db, 'categories', categoryId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function subscribeToOrders(orgId, callback) {
  const q = query(orgColRef(orgId, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

export async function addOrder(orgId, order) {
  const ref = await addDoc(orgColRef(orgId, 'orders'), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrder(orgId, orderId, updates) {
  await updateDoc(orgDocRef(orgId, 'orders', orderId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export function subscribeToSuppliers(orgId, callback) {
  const q = query(orgColRef(orgId, 'suppliers'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const suppliers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(suppliers);
  });
}

export async function addSupplier(orgId, supplier) {
  const ref = await addDoc(orgColRef(orgId, 'suppliers'), {
    ...supplier,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSupplier(orgId, supplierId, updates) {
  await updateDoc(orgDocRef(orgId, 'suppliers', supplierId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSupplier(orgId, supplierId) {
  await deleteDoc(orgDocRef(orgId, 'suppliers', supplierId));
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export function subscribeToWarehouses(orgId, callback) {
  const q = query(orgColRef(orgId, 'warehouses'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const warehouses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(warehouses);
  });
}

export async function addWarehouse(orgId, warehouse) {
  const ref = await addDoc(orgColRef(orgId, 'warehouses'), {
    ...warehouse,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWarehouse(orgId, warehouseId, updates) {
  await updateDoc(orgDocRef(orgId, 'warehouses', warehouseId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWarehouse(orgId, warehouseId) {
  await deleteDoc(orgDocRef(orgId, 'warehouses', warehouseId));
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Append an entry to the audit log. This is append-only.
 */
export async function addAuditLog(orgId, { action, details, performedBy }) {
  await addDoc(orgColRef(orgId, 'auditLog'), {
    action,
    details: details || '',
    performedBy: performedBy || null,
    timestamp: serverTimestamp(),
  });
}

/**
 * Subscribe to audit log entries.
 */
export function subscribeToAuditLog(orgId, callback) {
  const q = query(orgColRef(orgId, 'auditLog'), orderBy('timestamp', 'desc'), limit(200));
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(logs);
  });
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

/**
 * Seed a brand-new organization with demo data using a batch write.
 */
export async function seedOrgData(orgId, { products, categories, orders }) {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const p of products) {
    const { id: _id, ...rest } = p;
    const ref = doc(orgColRef(orgId, 'products'));
    batch.set(ref, { ...rest, createdAt: now, updatedAt: now });
  }
  for (const o of orders) {
    const { id: _id, ...rest } = o;
    const ref = doc(orgColRef(orgId, 'orders'));
    batch.set(ref, { ...rest, createdAt: now, updatedAt: now });
  }

  await batch.commit();
}

/**
 * Check if an organization has any products yet (used for seeding decision).
 */
export async function hasExistingProducts(orgId) {
  const snap = await getDocs(orgColRef(orgId, 'products'));
  return !snap.empty;
}

/**
 * Setup a shared demo organization workspace and link a demo user as a member with their assigned role.
 */
export async function setupDemoMember(uid, { email, name, role }) {
  const orgId = role === 'super_admin' ? null : 'demo-org-123';

  if (orgId) {
    // 1. Ensure the demo organization document exists
    // This might fail if it already exists and the current user is not an admin.
    // We swallow the error because the organization is already set up.
    try {
      const orgRef_ = doc(db, 'organizations', orgId);
      await setDoc(orgRef_, {
        name: 'Demo Corporation',
        ownerId: uid, // Can be set to the registering user
        planId: 'business', // Business plan unlocks all features (e.g. warehouses)
        settings: {
          currency: 'USD',
          timezone: 'UTC',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.log("Skipping demo org update (likely already exists and user is not admin):", err);
    }
  }

  const batch = writeBatch(db);

  // 2. Set user profile
  const userProfileRef = doc(db, 'users', uid);
  batch.set(userProfileRef, {
    uid,
    name,
    email,
    organizationId: orgId,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 3. Set membership and role details
  if (orgId) {
    const memRef = doc(db, 'organizations', orgId, 'members', uid);
    batch.set(memRef, {
      uid,
      name,
      email,
      role,
      joinedAt: serverTimestamp(),
      invitedBy: null,
    }, { merge: true });
  }

  await batch.commit();
}

/**
 * Create a store (organization) as Super Admin.
 */
export async function createStoreByAdmin({ name, type, planId, ownerId }) {
  const batch = writeBatch(db);
  const orgDocRef_ = doc(collection(db, 'organizations'));
  const orgId = orgDocRef_.id;

  batch.set(orgDocRef_, {
    name,
    type,
    planId: planId || 'free',
    ownerId: ownerId || null,
    status: 'active',
    settings: {
      currency: 'USD',
      timezone: 'UTC',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (ownerId) {
    const ownerProfile = await getUserProfile(ownerId);
    
    // Add to members collection
    const memRef = doc(db, 'organizations', orgId, 'members', ownerId);
    batch.set(memRef, {
      uid: ownerId,
      name: ownerProfile?.name || 'Store Owner',
      email: ownerProfile?.email || '',
      role: 'store_owner',
      joinedAt: serverTimestamp(),
      invitedBy: null,
    });

    // Update owner's user document
    batch.update(doc(db, 'users', ownerId), {
      organizationId: orgId,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return orgId;
}

/**
 * Assign a user to a store (organization) as Super Admin, handling transitions.
 */
export async function assignUserToStore(uid, orgId, role = 'store_owner') {
  const profile = await getUserProfile(uid);
  const oldOrgId = profile?.organizationId;

  if (profile?.role === 'super_admin') {
    throw new Error('Super Admin cannot be assigned to an organization.');
  }

  const batch = writeBatch(db);

  if (oldOrgId) {
    batch.delete(doc(db, 'organizations', oldOrgId, 'members', uid));
  }

  if (orgId) {
    const memRef = doc(db, 'organizations', orgId, 'members', uid);
    batch.set(memRef, {
      uid,
      name: profile?.name || 'User',
      email: profile?.email || '',
      role,
      joinedAt: serverTimestamp(),
      invitedBy: null,
    }, { merge: true });

    batch.update(doc(db, 'users', uid), {
      organizationId: orgId,
      role: role,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(doc(db, 'users', uid), {
      organizationId: null,
      role: null,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Update a store (organization) details as Super Admin.
 */
export async function updateStoreByAdmin(orgId, { name, type, planId, ownerId }) {
  const orgDocRef_ = doc(db, 'organizations', orgId);
  const snap = await getDoc(orgDocRef_);
  if (!snap.exists()) throw new Error('Store not found');
  const oldData = snap.data();
  const oldOwnerId = oldData.ownerId;

  const batch = writeBatch(db);

  // 1. Update organization root document
  batch.update(orgDocRef_, {
    name,
    type,
    planId,
    ownerId: ownerId || null,
    updatedAt: serverTimestamp(),
  });

  // 2. Handle owner transition if ownerId changed
  if (ownerId !== oldOwnerId) {
    if (oldOwnerId) {
      batch.delete(doc(db, 'organizations', orgId, 'members', oldOwnerId));
      batch.update(doc(db, 'users', oldOwnerId), {
        organizationId: null,
        updatedAt: serverTimestamp(),
      });
    }

    if (ownerId) {
      const ownerProfile = await getUserProfile(ownerId);
      const newOwnerOldOrgId = ownerProfile?.organizationId;
      if (newOwnerOldOrgId && newOwnerOldOrgId !== orgId) {
        batch.delete(doc(db, 'organizations', newOwnerOldOrgId, 'members', ownerId));
      }

      const memRef = doc(db, 'organizations', orgId, 'members', ownerId);
      batch.set(memRef, {
        uid: ownerId,
        name: ownerProfile?.name || 'Store Owner',
        email: ownerProfile?.email || '',
        role: 'store_owner',
        joinedAt: serverTimestamp(),
        invitedBy: null,
      }, { merge: true });

      batch.update(doc(db, 'users', ownerId), {
        organizationId: orgId,
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}

