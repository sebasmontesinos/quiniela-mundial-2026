import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteField,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const ENTRY_FEE_BS = Number(import.meta.env.VITE_ENTRY_FEE_BS) || 100;

const META_APP_REF = doc(db, 'meta', 'app');

export function isPlayerUser(user) {
  return Boolean(user && !user.isAdmin);
}

/**
 * Crea el documento del usuario en el primer login. No sobrescribe si ya existe.
 * El primer usuario es solo administrador (isAdmin), sin campo status.
 * El resto entra como jugador con status pending.
 */
export async function ensureUserDocument(authUser) {
  const userRef = doc(db, 'users', authUser.uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    const data = { id: existing.id, ...existing.data() };
    return normalizeAdminDocument(authUser.uid, data);
  }

  const created = await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }

    const metaSnap = await transaction.get(META_APP_REF);
    const isFirstUser = !metaSnap.exists();

    const userData = isFirstUser
      ? {
          uid: authUser.uid,
          name: authUser.displayName || 'Usuario',
          email: authUser.email || '',
          photoURL: authUser.photoURL || '',
          isAdmin: true,
          createdAt: serverTimestamp(),
        }
      : {
          uid: authUser.uid,
          name: authUser.displayName || 'Usuario',
          email: authUser.email || '',
          photoURL: authUser.photoURL || '',
          status: 'pending',
          createdAt: serverTimestamp(),
          paidAt: null,
        };

    transaction.set(userRef, userData);

    if (isFirstUser) {
      transaction.set(META_APP_REF, { hasUsers: true, createdAt: serverTimestamp() });
    }

    return { id: authUser.uid, ...userData, createdAt: new Date() };
  });

  return normalizeAdminDocument(authUser.uid, created);
}

/** Quita status/paidAt de admins creados con el modelo anterior. */
export async function normalizeAdminDocument(uid, data) {
  if (!data?.isAdmin) {
    return data;
  }
  if (!('status' in data) && !('paidAt' in data)) {
    return data;
  }

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    status: deleteField(),
    paidAt: deleteField(),
  });

  const snap = await getDoc(userRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : data;
}

export function subscribeToUserDocument(uid, onData, onError) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onData({ id: snap.id, ...snap.data() });
      } else {
        onData(null);
      }
    },
    onError
  );
}

export async function fetchAllUsers() {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateUserStatus(targetUid, status) {
  const userRef = doc(db, 'users', targetUid);
  const targetSnap = await getDoc(userRef);

  if (!targetSnap.exists()) {
    throw new Error('Usuario no encontrado.');
  }

  if (targetSnap.data().isAdmin) {
    throw new Error('Los administradores no tienen estado de cuenta.');
  }

  const payload = { status };

  if (status === 'active') {
    payload.paidAt = serverTimestamp();
  }

  await updateDoc(userRef, payload);
}
