/**
 * firestoreService.js
 * Centralized Firestore CRUD helpers for Smartventory.
 * All data is scoped per-user under: users/{uid}/{collection}
 * This module is reusable for future mobile (iOS/Android) SDK integrations.
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
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Path helpers ─────────────────────────────────────────────────────────────

const userRef = (uid) => doc(db, 'users', uid);
const colRef = (uid, col) => collection(db, 'users', uid, col);
const docRef = (uid, col, id) => doc(db, 'users', uid, col, id);

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Create a new user profile document in Firestore on first registration.
 */
export async function createUserProfile(uid, data) {
  await setDoc(userRef(uid), {
    uid,
    name: data.name || '',
    email: data.email || '',
    store: data.store || 'My Store',
    planId: 'free',
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

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time product updates for a user.
 * Returns the unsubscribe function — call it on component unmount.
 */
export function subscribeToProducts(uid, callback) {
  const q = query(colRef(uid, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(products);
  });
}

export async function addProduct(uid, product) {
  const ref = await addDoc(colRef(uid, 'products'), {
    ...product,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(uid, productId, updates) {
  await updateDoc(docRef(uid, 'products', productId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(uid, productId) {
  await deleteDoc(docRef(uid, 'products', productId));
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function subscribeToCategories(uid, callback) {
  const q = query(colRef(uid, 'categories'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(categories);
  });
}

export async function addCategory(uid, category) {
  const ref = await addDoc(colRef(uid, 'categories'), {
    ...category,
    productCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(uid, categoryId, updates) {
  await updateDoc(docRef(uid, 'categories', categoryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(uid, categoryId) {
  await deleteDoc(docRef(uid, 'categories', categoryId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function subscribeToOrders(uid, callback) {
  const q = query(colRef(uid, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

export async function addOrder(uid, order) {
  const ref = await addDoc(colRef(uid, 'orders'), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrder(uid, orderId, updates) {
  await updateDoc(docRef(uid, 'orders', orderId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

/**
 * Seed a brand-new user's Firestore with demo data using a batch write.
 * Only called when a user has zero products on their first login.
 */
export async function seedUserData(uid, { products, categories, orders }) {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const p of products) {
    const { id: _id, ...rest } = p;
    const ref = doc(colRef(uid, 'products'));
    batch.set(ref, { ...rest, createdAt: now, updatedAt: now });
  }
  for (const c of categories) {
    const { id: _id, ...rest } = c;
    const ref = doc(colRef(uid, 'categories'));
    batch.set(ref, { ...rest, createdAt: now, updatedAt: now });
  }
  for (const o of orders) {
    const { id: _id, ...rest } = o;
    const ref = doc(colRef(uid, 'orders'));
    batch.set(ref, { ...rest, createdAt: now, updatedAt: now });
  }

  await batch.commit();
}

/**
 * Check if a user has any products yet (used for seeding decision).
 */
export async function hasExistingProducts(uid) {
  const snap = await getDocs(colRef(uid, 'products'));
  return !snap.empty;
}
