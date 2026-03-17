import { API_BASE_URL } from './constants';

/** Resource: /resource/menus */
export const getAllMenus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/resource/menus`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching all menus:', error);
    return [];
  }
};

/** Derived: all menus flattened with restaurantId / restaurantName. */
export const getAllMenuItems = async () => {
  try {
    const allMenus = await getAllMenus();
    return allMenus.map((menu) => ({
      ...menu,
      restaurantId: menu.restaurant || menu.restaurants?.value,
      restaurantName: menu.restaurants?.label,
    }));
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    return [];
  }
};
