import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  DocumentChange
} from 'firebase/firestore';
import { db } from '../firebase';

export interface DonationAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  targetRole?: 'volunteer' | 'admin' | 'all';
  foodName?: string;
  donorName?: string;
  organization?: string;
  quantity?: string;
  city?: string;
  createdAt: string;
  isRead?: boolean;
}

/**
 * Gets the current active role from FoodBridge platform session.
 * Supports the multiple session key shapes used across donor/volunteer/admin flows.
 */
function normalizeRole(role: unknown): 'volunteer' | 'admin' | 'donor' | 'guest' | null {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'volunteer' || normalized === 'volunteer_user') return 'volunteer';
  if (normalized === 'donor') return 'donor';
  return null;
}

function readProperty(value: unknown, key: string): unknown {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

export function getCurrentPlatformRole(): 'volunteer' | 'admin' | 'donor' | 'guest' {
  const sessionKeys = [
    'foodbridge_admin_session',
    'foodbridge_current_session',
    'foodbridge_user_session',
    'foodbridge_active_session',
    'foodbridge_user_role',
    'foodbridge_active_role',
    'selectedPortal',
    'current_role',
  ];

  try {
    for (const key of sessionKeys) {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) continue;

      const rawRole = normalizeRole(raw);
      if (rawRole) return rawRole;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const parsedRole = normalizeRole(parsed);
      if (parsedRole) return parsedRole;

      const sessionRole = normalizeRole(readProperty(parsed, 'role'));
      if (sessionRole) return sessionRole;

      const candidates = [
        readProperty(readProperty(parsed, 'profile'), 'role'),
        readProperty(readProperty(parsed, 'user'), 'role'),
        readProperty(parsed, 'portal'),
        readProperty(readProperty(parsed, 'account'), 'role'),
        readProperty(readProperty(parsed, 'data'), 'role'),
        readProperty(parsed, 'userType'),
        readProperty(parsed, 'type'),
      ];

      for (const candidate of candidates) {
        const normalized = normalizeRole(candidate);
        if (normalized) return normalized;
      }
    }

  } catch (e) {
    console.warn('Could not determine platform role:', e);
  }

  const path = window.location.pathname.toLowerCase();
  if (path.includes('/admin') || path.includes('admin')) return 'admin';
  if (path.includes('/volunteer') || path.includes('volunteer')) return 'volunteer';
  if (path.includes('/donor') || path.includes('donor')) return 'donor';

  return 'guest';
}

/**
 * Real-time Firestore snapshot listener for donation notifications.
 * Alert triggers whenever a new food donation is created in Cloud Firestore.
 */
export function listenToDonationSnapshots(
  onNewAlert: (alert: DonationAlert) => void,
  onListUpdate?: (alerts: DonationAlert[]) => void
): () => void {
  let isInitialLoad = true;

  try {
    const notifsRef = collection(db, 'notifications');
    // Order by createdAt descending and limit to the last 25 notifications
    const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(25));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alertsList: DonationAlert[] = [];

        snapshot.docChanges().forEach((change: DocumentChange) => {
          const data = change.doc.data();
          const alert: DonationAlert = {
            id: change.doc.id,
            type: data.type || 'new_donation',
            title: data.title || 'New Food Donation Available',
            description: data.description || '',
            targetRole: data.targetRole || 'all',
            foodName: data.foodName || '',
            donorName: data.donorName || '',
            organization: data.organization || '',
            quantity: data.quantity || '',
            city: data.city || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            isRead: Boolean(data.isRead),
          };

          // On new additions after initial load, trigger immediate real-time alert
          if (change.type === 'added' && !isInitialLoad) {
            const currentRole = getCurrentPlatformRole();
            const target = String(alert.targetRole || 'all').toLowerCase();
            const normalizedCurrentRole = normalizeRole(currentRole) || 'guest';
            const isTarget =
              target === 'all' ||
              normalizedCurrentRole === 'admin' ||
              normalizedCurrentRole === target ||
              (normalizedCurrentRole === 'volunteer' && (target === 'volunteer' || target === 'all'));

            if (isTarget) {
              onNewAlert(alert);
              // Dispatch standard window event for the SPA components
              window.dispatchEvent(
                new CustomEvent('foodbridge_new_donation_notification', { detail: alert })
              );
            }
          }
        });

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          alertsList.push({
            id: doc.id,
            type: data.type || 'new_donation',
            title: data.title || 'New Food Donation',
            description: data.description || '',
            targetRole: data.targetRole || 'all',
            foodName: data.foodName || '',
            donorName: data.donorName || '',
            organization: data.organization || '',
            quantity: data.quantity || '',
            city: data.city || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            isRead: Boolean(data.isRead),
          });
        });

        if (onListUpdate) {
          onListUpdate(alertsList);
        }

        isInitialLoad = false;
      },
      (error) => {
        console.warn('Firestore real-time notifications snapshot listener warning:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore snapshot listener:', err);
    return () => {};
  }
}

/**
 * Creates donation notification in Cloud Firestore so all listening volunteers and admins get instant snapshot alerts
 */
export async function pushDonationToFirestore(donation: {
  food_name: string;
  quantity: string | number;
  quantity_unit?: string;
  organization?: string;
  donor_name?: string;
  city?: string;
  category?: string;
  address?: string;
  meals_count?: number;
}): Promise<void> {
  const notifsRef = collection(db, 'notifications');
  const unit = donation.quantity_unit || 'servings';
  const org = donation.organization || donation.donor_name || 'Community Donor';
  const city = donation.city || 'Local area';

  await addDoc(notifsRef, {
    type: 'new_donation',
    targetRole: 'volunteer',
    title: '🚨 New Food Donation Available!',
    description: `${donation.food_name} (${donation.quantity} ${unit}) posted by ${org} in ${city}. Available for immediate pickup!`,
    foodName: donation.food_name,
    donorName: donation.donor_name || '',
    organization: org,
    quantity: `${donation.quantity} ${unit}`,
    city,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  await addDoc(notifsRef, {
    type: 'new_donation',
    targetRole: 'admin',
    title: '📋 New Donation Listed',
    description: `${org} listed ${donation.food_name} (${donation.quantity} ${unit}) in ${city}.`,
    foodName: donation.food_name,
    donorName: donation.donor_name || '',
    organization: org,
    quantity: `${donation.quantity} ${unit}`,
    city,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export interface LiveLocationRecord {
  userId: string;
  name: string;
  role: 'donor' | 'volunteer' | 'admin';
  organization?: string;
  lat: number;
  lng: number;
  address?: string;
  status: 'active' | 'in_transit' | 'ready' | 'idle';
  updatedAt: string;
}

/**
 * Shares user live location (Donor or Volunteer) to Firestore and local store
 */
export async function shareUserLiveLocation(record: {
  userId?: string;
  name?: string;
  role: 'donor' | 'volunteer' | 'admin';
  organization?: string;
  lat: number;
  lng: number;
  address?: string;
  status?: 'active' | 'in_transit' | 'ready' | 'idle';
}): Promise<void> {
  const userId = record.userId || `user-${record.role}-${Date.now()}`;
  const name = record.name || (record.role === 'donor' ? 'Food Donor' : 'Volunteer Courier');
  const nowStr = new Date().toISOString();

  const locItem: LiveLocationRecord = {
    userId,
    name,
    role: record.role,
    organization: record.organization || '',
    lat: record.lat,
    lng: record.lng,
    address: record.address || '',
    status: record.status || 'active',
    updatedAt: nowStr,
  };

  // 1. Update localStorage cache
  try {
    const raw = localStorage.getItem('foodbridge_live_locations');
    const list: LiveLocationRecord[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((x) => x.userId === userId);
    if (idx >= 0) {
      list[idx] = locItem;
    } else {
      list.push(locItem);
    }
    localStorage.setItem('foodbridge_live_locations', JSON.stringify(list));

    // Also update profile coordinates in storage if available
    const curSess = localStorage.getItem('foodbridge_current_session');
    if (curSess) {
      const parsed = JSON.parse(curSess);
      if (parsed.profile) {
        parsed.profile.current_location_lat = record.lat;
        parsed.profile.current_location_lng = record.lng;
        localStorage.setItem('foodbridge_current_session', JSON.stringify(parsed));
      }
    }
  } catch (e) {
    console.warn('Could not save location locally:', e);
  }

  // 2. Sync to a stable Firestore document so every update moves the same donor marker.
  try {
    const locationDoc = doc(db, 'live_locations', userId);
    await setDoc(locationDoc, {
      ...locItem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('Could not sync live location to Firestore:', e);
  }

  // 3. Dispatch window event for live in-app listeners
  try {
    window.dispatchEvent(
      new CustomEvent('foodbridge_live_location_updated', {
        detail: locItem,
      })
    );
  } catch (e) {}
}

/**
 * Listens to live locations of volunteers and donors in real time
 */
export function listenToLiveLocations(
  onUpdate: (locations: LiveLocationRecord[]) => void
): () => void {
  // Read initial local cache
  try {
    const raw = localStorage.getItem('foodbridge_live_locations');
    if (raw) {
      onUpdate(JSON.parse(raw));
    }
  } catch (e) {}

  // In-app window event listener
  const handler = () => {
    try {
      const raw = localStorage.getItem('foodbridge_live_locations');
      if (raw) onUpdate(JSON.parse(raw));
    } catch (e) {}
  };
  window.addEventListener('foodbridge_live_location_updated', handler);

  // Firestore real-time snapshot listener
  try {
    const locRef = collection(db, 'live_locations');
    const q = query(locRef, limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: LiveLocationRecord[] = [];
      snapshot.forEach((locationDoc) => {
        const d = locationDoc.data();
        if (d.lat != null && d.lng != null) {
          items.push({
            userId: d.userId || locationDoc.id,
            name: d.name || 'User',
            role: d.role || 'volunteer',
            organization: d.organization || '',
            lat: Number(d.lat),
            lng: Number(d.lng),
            address: d.address || '',
            status: d.status || 'active',
            updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString()),
          });
        }
      });
      onUpdate(items);
    });

    return () => {
      window.removeEventListener('foodbridge_live_location_updated', handler);
      unsubscribe();
    };
  } catch (e) {
    return () => {
      window.removeEventListener('foodbridge_live_location_updated', handler);
    };
  }
}
