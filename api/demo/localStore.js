import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'demo_local_state';

export const DEMO_LOCAL_STATE_KEY = STORAGE_KEY;

const emptyState = () => ({
  favoriteAddedIds: [],
  favoriteRemovedIds: [],
  profilePatch: {},
  paymentMethodsAdded: [],
  paymentMethodRemovedIds: [],
  defaultPaymentMethodId: null,
  paymentMethodPatches: {},
  orderStatusById: {},
  localOrders: [],
  transactions: [],
  registeredUsers: [],
});

export async function getDemoState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

export async function saveDemoState(patch) {
  const current = await getDemoState();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function updateDemoState(updater) {
  const current = await getDemoState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
