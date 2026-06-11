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
import { db } from './firebase';

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

// ─── Organization ─────────────────────────────────────────────────────────────

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

export function subscribeToCategories(orgId, callback) {
  const q = query(orgColRef(orgId, 'categories'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(categories);
  });
}

export async function addCategory(orgId, category) {
  const ref = await addDoc(orgColRef(orgId, 'categories'), {
    ...category,
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(orgId, categoryId, updates) {
  await updateDoc(orgDocRef(orgId, 'categories', categoryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(orgId, categoryId) {
  await deleteDoc(orgDocRef(orgId, 'categories', categoryId));
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
  for (const c of categories) {
    const { id: _id, ...rest } = c;
    const ref = doc(orgColRef(orgId, 'categories'));
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
