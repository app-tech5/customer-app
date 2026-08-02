import { api } from '../../api';

export const loadCartFromServer = async (dispatch) => {
  try {
    const cart = await api.getCart();
    const items = cart?.items || cart?.localItems || [];
    dispatch({ type: 'LOAD_CART', payload: items });
    return items;
  } catch (error) {
    console.warn('loadCartFromServer failed', error?.message || error);
    return [];
  }
};

export const syncCartWithServer = async (dispatch, getState) => {
  try {
    const localItems = typeof getState === 'function' ? getState()?.cartReducer || [] : [];
    const cart = await api.syncCart(localItems);
    const items = cart?.items || cart?.localItems || localItems;
    dispatch({ type: 'LOAD_CART', payload: items });
    return items;
  } catch (error) {
    console.warn('syncCartWithServer failed', error?.message || error);
    return null;
  }
};
