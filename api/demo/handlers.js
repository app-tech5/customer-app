import { API_BASE_URL } from '../constants';
import { buildOrderPaymentTransaction } from '../walletUtils';
import { getDemoState, updateDemoState } from './localStore';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const matchPath = (endpoint, pattern) => {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
  return endpoint.match(regex);
};

const parseBody = (options) => {
  if (!options.body) return {};
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }
  return options.body;
};

const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const getRestaurantId = (restaurantRef) => {
  if (!restaurantRef) return null;
  if (typeof restaurantRef === 'string' || typeof restaurantRef === 'number') {
    return String(restaurantRef);
  }
  return String(restaurantRef._id || restaurantRef.id || '');
};

const enrichOrderRestaurant = async (client, order) => {
  if (!order) return order;

  const existing = order.restaurant;
  if (existing && typeof existing === 'object' && existing.name) {
    return order;
  }

  const restaurantId = getRestaurantId(existing || order.restaurantId);
  if (!restaurantId) return order;

  try {
    const restaurant = await fetchFromApi(client, `/resource/restaurants/${restaurantId}`);
    const normalized =
      typeof client.normalizeRestaurant === 'function'
        ? client.normalizeRestaurant(restaurant)
        : restaurant;

    return {
      ...order,
      restaurant: {
        _id: normalized._id || normalized.id || restaurantId,
        id: normalized._id || normalized.id || restaurantId,
        name: normalized.name || order.restaurantName || 'Restaurant',
        image: normalized.image || normalized.image_url || null,
      },
    };
  } catch {
    return {
      ...order,
      restaurant: {
        _id: restaurantId,
        id: restaurantId,
        name: order.restaurantName || 'Restaurant',
        image: null,
      },
    };
  }
};

const enrichOrdersRestaurants = async (client, orders) =>
  Promise.all((orders || []).map((order) => enrichOrderRestaurant(client, order)));

export async function fetchFromApi(client, endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: client.getHeaders(),
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function handleDemoWrite(client, endpoint, method, options = {}) {
  if (!WRITE_METHODS.has(method)) {
    return null;
  }

  const body = parseBody(options);

  const favoritesPost = matchPath(endpoint, '/users/favorites/:restaurantId');
  if (favoritesPost && method === 'POST') {
    const restaurantId = favoritesPost[1];
    await updateDemoState((state) => ({
      ...state,
      favoriteAddedIds: [...new Set([...state.favoriteAddedIds, restaurantId])],
      favoriteRemovedIds: state.favoriteRemovedIds.filter((id) => String(id) !== String(restaurantId)),
    }));
    return { success: true };
  }

  const favoritesDelete = matchPath(endpoint, '/users/favorites/:restaurantId');
  if (favoritesDelete && method === 'DELETE') {
    const restaurantId = favoritesDelete[1];
    await updateDemoState((state) => ({
      ...state,
      favoriteRemovedIds: [...new Set([...state.favoriteRemovedIds, restaurantId])],
      favoriteAddedIds: state.favoriteAddedIds.filter((id) => String(id) !== String(restaurantId)),
    }));
    return { success: true };
  }

  const userPut = matchPath(endpoint, '/resource/users/:userId');
  if (userPut && method === 'PUT') {
    const userId = userPut[1];
    await updateDemoState((state) => ({
      ...state,
      profilePatch: { ...state.profilePatch, ...body },
      registeredUsers: state.registeredUsers.map((user) =>
        String(user.id) === String(userId) ? { ...user, ...body } : user
      ),
    }));
    if (client.user && String(client.user.id || client.user.userId) === String(userId)) {
      client.user = { ...client.user, ...body };
      await client.saveToStorage();
    }
    return { ...body, success: true };
  }

  const avatarPut = matchPath(endpoint, '/resource/users/:userId/avatar');
  if (avatarPut && method === 'PUT') {
    const image = body.avatar || body.image;
    await updateDemoState((state) => ({
      ...state,
      profilePatch: { ...state.profilePatch, image },
    }));
    if (client.user) {
      client.user = { ...client.user, image };
      await client.saveToStorage();
    }
    return { image, success: true };
  }

  if (endpoint === '/resource/paymentMethods' && method === 'POST') {
    const id = body.id || newId('demo_pm');
    const methodEntry = {
      ...body,
      _id: id,
      id,
      isActive: body.isActive !== false,
    };
    await updateDemoState((state) => ({
      ...state,
      paymentMethodsAdded: [...state.paymentMethodsAdded, methodEntry],
      defaultPaymentMethodId: state.defaultPaymentMethodId || (body.isDefault ? id : null),
    }));
    return methodEntry;
  }

  const paymentPut = matchPath(endpoint, '/resource/paymentMethods/:id');
  if (paymentPut && method === 'PUT') {
    const methodId = paymentPut[1];
    if (body.isDefault) {
      await updateDemoState((state) => ({
        ...state,
        defaultPaymentMethodId: methodId,
      }));
    } else {
      await updateDemoState((state) => ({
        ...state,
        paymentMethodPatches: {
          ...state.paymentMethodPatches,
          [methodId]: { ...state.paymentMethodPatches[methodId], ...body },
        },
      }));
    }
    return { ...body, _id: methodId, id: methodId };
  }

  const paymentDelete = matchPath(endpoint, '/resource/paymentMethods/:id');
  if (paymentDelete && method === 'DELETE') {
    const methodId = paymentDelete[1];
    await updateDemoState((state) => ({
      ...state,
      paymentMethodRemovedIds: [...new Set([...state.paymentMethodRemovedIds, methodId])],
      paymentMethodsAdded: state.paymentMethodsAdded.filter(
        (m) => String(m._id || m.id) !== String(methodId)
      ),
      defaultPaymentMethodId:
        String(state.defaultPaymentMethodId) === String(methodId) ? null : state.defaultPaymentMethodId,
    }));
    return { success: true };
  }

  const orderPut = matchPath(endpoint, '/resource/orders/:orderId');
  if (orderPut && method === 'PUT') {
    const orderId = orderPut[1];
    if (body.status) {
      await updateDemoState((state) => ({
        ...state,
        orderStatusById: { ...state.orderStatusById, [orderId]: body.status },
        localOrders: state.localOrders.map((order) =>
          String(order._id || order.id) === String(orderId)
            ? { ...order, status: body.status }
            : order
        ),
      }));
    }
    return { _id: orderId, id: orderId, ...body };
  }

  if (endpoint === '/resource/orders' && method === 'POST') {
    const orderId = newId('demo_order');
    let order = {
      _id: orderId,
      id: orderId,
      ...body,
      status: body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderId: `DEMO-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
    };
    order = await enrichOrderRestaurant(client, order);
    const paymentMethod = body.payment?.method || body.paymentMethod;
    const transactionPayload = buildOrderPaymentTransaction({
      userId: body.user,
      amount: body.totalPrice,
      paymentMethod,
      orderId,
    });
    const transaction = {
      _id: newId('demo_tx'),
      ...transactionPayload,
      createdAt: new Date().toISOString(),
      date_created: new Date().toISOString(),
    };
    await updateDemoState((state) => ({
      ...state,
      localOrders: [order, ...state.localOrders],
      transactions: [transaction, ...state.transactions],
    }));
    return order;
  }

  if (endpoint === '/payments/stripe/attach-payment-method' && method === 'POST') {
    return { success: true };
  }

  if (endpoint === '/payments/stripe/remove-payment-method' && method === 'POST') {
    return { success: true };
  }

  if (endpoint === '/payments/stripe/payment-intent' && method === 'POST') {
    return { client_secret: `demo_pi_${Date.now()}_secret` };
  }

  const chatPost = matchPath(endpoint, '/orders/:orderId/chat');
  if (chatPost && method === 'POST') {
    const orderId = chatPost[1];
    const text = String(body.text || '').trim();
    if (!text) throw new Error('Message text is required');
    const msg = {
      id: newId('demo_chat'),
      order: orderId,
      sender: String(client.user?.id || 'demo_user'),
      senderName: client.user?.name || 'You',
      senderRole: 'customer',
      text,
      createdAt: new Date().toISOString(),
    };
    await updateDemoState((state) => {
      const prev = state.chatMessagesByOrder?.[orderId] || [];
      return {
        ...state,
        chatMessagesByOrder: {
          ...(state.chatMessagesByOrder || {}),
          [orderId]: [...prev, msg],
        },
      };
    });
    return msg;
  }

  if (endpoint === '/resource/transactions' && method === 'POST') {
    const transaction = {
      _id: newId('demo_tx'),
      ...body,
      status: body.status || 'completed',
      createdAt: new Date().toISOString(),
    };
    await updateDemoState((state) => ({
      ...state,
      transactions: [transaction, ...state.transactions],
    }));
    return transaction;
  }

  if (endpoint === '/auth/customer-login' && method === 'POST') {
    const state = await getDemoState();
    const email = body.email?.trim()?.toLowerCase();
    const demoUser = state.registeredUsers.find(
      (user) => user.email?.trim()?.toLowerCase() === email
    );

    if (demoUser) {
      if (demoUser.password !== body.password) {
        throw new Error('Invalid email or password');
      }

      const token = `demo_token_${demoUser.id}`;
      const responseUser = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: 'customer',
      };

      client.token = token;
      client.user = responseUser;
      await client.saveToStorage();

      return { token, user: responseUser };
    }

    return null;
  }

  if (endpoint === '/auth/signup' && method === 'POST') {
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !body.password || !body.name) {
      throw new Error('Email, password and name are required');
    }

    const state = await getDemoState();
    const alreadyRegistered = state.registeredUsers.some(
      (user) => user.email?.trim()?.toLowerCase() === email
    );

    if (alreadyRegistered) {
      throw new Error('Email already in use');
    }

    const id = newId('demo_user');
    const user = {
      id,
      email: body.email.trim(),
      password: body.password,
      name: body.name.trim(),
      phone: body.phone || '',
      address: body.address || '',
      lat: body.lat,
      lng: body.lng,
      location: body.location,
      image: '',
      role: 'customer',
      isDemo: true,
    };

    await updateDemoState((current) => ({
      ...current,
      registeredUsers: [...current.registeredUsers, user],
    }));

    return { success: true, message: 'Account created (demo)' };
  }

  return null;
}

const toPublicDemoUser = (user, profilePatch = {}) => {
  const { password, ...safeUser } = user;
  return { ...safeUser, ...profilePatch };
};

const getDemoProfile = (state, userId, client) => {
  const demoUser = state.registeredUsers.find(
    (user) => String(user.id) === String(userId)
  );

  if (demoUser) {
    return toPublicDemoUser(demoUser, state.profilePatch);
  }

  if (String(client.user?.id) === String(userId)) {
    return { ...client.user, ...state.profilePatch };
  }

  return null;
};

const buildDemoAddresses = (profile) => {
  const address = profile?.address?.trim();
  if (!address) return [];

  const lat = profile.location?.latitude ?? profile.lat;
  const lng = profile.location?.longitude ?? profile.lng;

  return [
    {
      id: 'user_default',
      type: 'home',
      name: 'My Address',
      address,
      city: '',
      postalCode: '',
      country: 'France',
      isDefault: true,
      coordinates:
        lat != null && lng != null && Number.isFinite(Number(lat))
          ? { lat: Number(lat), lng: Number(lng) }
          : null,
    },
  ];
};

const getLocalDemoOrder = async (client, state, orderId) => {
  const local = state.localOrders.find(
    (order) => String(order._id || order.id) === String(orderId)
  );

  if (!local) return null;

  const status = state.orderStatusById[orderId];
  const withStatus = status ? { ...local, status } : local;
  return enrichOrderRestaurant(client, withStatus);
};

export async function handleDemoRead(client, endpoint, method) {
  if (method !== 'GET') {
    return null;
  }

  const state = await getDemoState();

  const orderGet = matchPath(endpoint, '/resource/orders/:orderId');
  if (orderGet) {
    const orderId = orderGet[1];
    if (String(orderId).startsWith('demo_order_')) {
      const order = await getLocalDemoOrder(client, state, orderId);
      if (order) return order;
      throw new Error('Order not found');
    }
  }

  const chatGet = matchPath(endpoint, '/orders/:orderId/chat');
  if (chatGet) {
    const orderId = chatGet[1];
    return {
      orderId,
      messages: state.chatMessagesByOrder?.[orderId] || [],
    };
  }

  if (!client.token?.startsWith('demo_token_')) {
    return null;
  }

  const userGet = matchPath(endpoint, '/resource/users/:userId');
  if (userGet) {
    const requestedId = userGet[1];
    const demoUser = state.registeredUsers.find(
      (user) => String(user.id) === String(requestedId)
    );
    if (demoUser) {
      return toPublicDemoUser(demoUser, state.profilePatch);
    }
  }

  const addressesGet = matchPath(endpoint, '/users/:userId/addresses');
  if (addressesGet) {
    const userId = addressesGet[1];
    if (String(client.user?.id) !== String(userId)) {
      return [];
    }
    const profile = getDemoProfile(state, userId, client);
    return buildDemoAddresses(profile);
  }

  if (endpoint === '/users/favorites') {
    const favorites = [];
    for (const id of state.favoriteAddedIds) {
      try {
        const restaurant = await fetchFromApi(client, `/resource/restaurants/${id}`);
        favorites.push(
          typeof client.normalizeRestaurant === 'function'
            ? client.normalizeRestaurant(restaurant)
            : restaurant
        );
      } catch {
        favorites.push({ _id: id, id, name: 'Restaurant' });
      }
    }
    return { success: true, favorites };
  }

  if (endpoint === '/resource/orders') {
    return enrichOrdersRestaurants(client, applyOrderOverrides([], state));
  }

  if (endpoint === '/resource/paymentMethods/byUserId') {
    return applyPaymentMethodOverrides([], state);
  }

  if (endpoint === '/resource/transactions/byUserId') {
    return {
      transactions: state.transactions,
      balance: computeWalletBalance(state.transactions),
    };
  }

  return null;
}

const applyPaymentMethodOverrides = (methods, state) => {
  let list = (methods || [])
    .filter((m) => !state.paymentMethodRemovedIds.includes(String(m._id || m.id)))
    .map((m) => {
      const key = String(m._id || m.id);
      const patch = state.paymentMethodPatches[key];
      return patch ? { ...m, ...patch } : m;
    });

  const existingIds = new Set(list.map((m) => String(m._id || m.id)));
  state.paymentMethodsAdded.forEach((added) => {
    const key = String(added._id || added.id);
    if (!existingIds.has(key)) {
      list.push(added);
      existingIds.add(key);
    }
  });

  if (state.defaultPaymentMethodId) {
    list = list.map((m) => ({
      ...m,
      isDefault: String(m._id || m.id) === String(state.defaultPaymentMethodId),
    }));
  }

  return list;
};

const computeWalletBalance = (transactions) =>
  (transactions || []).reduce((acc, doc) => {
    if (doc.status !== 'completed') return acc;
    const amount = Number(doc.amount) || 0;

    if (
      doc.transaction_type === 'customer_top_up' ||
      doc.transaction_type === 'refund' ||
      doc.transaction_type === 'adjustment'
    ) {
      return acc + amount;
    }

    if (
      doc.transaction_type === 'customer_payment' &&
      doc.payment_method === 'platform_credit'
    ) {
      return acc - amount;
    }

    return acc;
  }, 0);

const applyOrderOverrides = (orders, state) => {
  const apiOrders = (orders || []).map((order) => {
    const orderId = String(order._id || order.id);
    const status = state.orderStatusById[orderId];
    return status ? { ...order, status } : order;
  });

  const apiIds = new Set(apiOrders.map((o) => String(o._id || o.id)));
  const localOnly = state.localOrders.filter(
    (o) => !apiIds.has(String(o._id || o.id))
  );

  return [...localOnly, ...apiOrders];
};

export async function mergeDemoRead(client, endpoint, data) {
  const state = await getDemoState();

  if (endpoint === '/users/favorites') {
    let favorites = Array.isArray(data?.favorites) ? [...data.favorites] : [];
    favorites = favorites.filter(
      (f) => !state.favoriteRemovedIds.includes(String(f._id || f.id))
    );

    const existingIds = new Set(favorites.map((f) => String(f._id || f.id)));
    for (const id of state.favoriteAddedIds) {
      if (existingIds.has(String(id))) continue;
      try {
        const restaurant = await fetchFromApi(client, `/resource/restaurants/${id}`);
        favorites.push(
          typeof client.normalizeRestaurant === 'function'
            ? client.normalizeRestaurant(restaurant)
            : restaurant
        );
      } catch {
        favorites.push({ _id: id, id, name: 'Restaurant' });
      }
    }

    return { ...data, success: true, favorites };
  }

  if (endpoint === '/resource/paymentMethods/byUserId') {
    return applyPaymentMethodOverrides(data, state);
  }

  const userGet = matchPath(endpoint, '/resource/users/:userId');
  if (userGet) {
    const requestedId = userGet[1];
    const demoUser = state.registeredUsers.find(
      (user) => String(user.id) === String(requestedId)
    );
    if (demoUser) {
      return toPublicDemoUser(demoUser, state.profilePatch);
    }
    if (Object.keys(state.profilePatch).length > 0) {
      return { ...data, ...state.profilePatch };
    }
  }

  if (endpoint === '/resource/orders') {
    return enrichOrdersRestaurants(client, applyOrderOverrides(data, state));
  }

  const orderGet = matchPath(endpoint, '/resource/orders/:orderId');
  if (orderGet) {
    const orderId = orderGet[1];
    const order = await getLocalDemoOrder(client, state, orderId);
    if (order) return order;
    const status = state.orderStatusById[orderId];
    if (status && data) return enrichOrderRestaurant(client, { ...data, status });
    if (data) return enrichOrderRestaurant(client, data);
    return data;
  }

  if (endpoint === '/resource/transactions/byUserId') {
    const apiTransactions = Array.isArray(data?.transactions)
      ? data.transactions
      : Array.isArray(data)
        ? data
        : [];
    const localIds = new Set(
      state.transactions.map((tx) => String(tx._id || tx.id))
    );
    const merged = [
      ...state.transactions,
      ...apiTransactions.filter((tx) => !localIds.has(String(tx._id || tx.id))),
    ];
    return {
      transactions: merged,
      balance: computeWalletBalance(merged),
    };
  }

  return data;
}
