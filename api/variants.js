import { API_BASE_URL } from './constants';

/** Resource: /resource/variants */
export const getVariants = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/resource/variants`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des variants:', error);
    return [];
  }
};
