import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFavorites, addToFavorites, removeFromFavorites } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const reduxFavorites = useSelector(state => state.user?.favorites || []);

  // Charger les favoris depuis l'API
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      if (response.success && response.favorites) {
        const favoriteIds = response.favorites.map(fav => fav._id || fav.id);
        setFavorites(favoriteIds);
        // Synchroniser avec Redux
        dispatch({ type: 'SET_FAVORITES', payload: favoriteIds });
      } else {
        setFavorites([]);
        dispatch({ type: 'SET_FAVORITES', payload: [] });
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
      dispatch({ type: 'SET_FAVORITES', payload: [] });
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Vérifier si un restaurant est dans les favoris
  const isFavorite = useCallback((restaurantId) => {
    return favorites.includes(restaurantId);
  }, [favorites]);

  // Ajouter aux favoris
  const addToFavorite = useCallback(async (restaurantId) => {
    try {
      setLoading(true);
      await addToFavorites(restaurantId);

      // Mettre à jour l'état local
      setFavorites(prev => [...prev, restaurantId]);

      // Synchroniser avec Redux
      dispatch({ type: 'ADD_FAVORITE', payload: restaurantId });

      return { success: true };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Retirer des favoris
  const removeFromFavorite = useCallback(async (restaurantId) => {
    try {
      setLoading(true);
      await removeFromFavorites(restaurantId);

      // Mettre à jour l'état local
      setFavorites(prev => prev.filter(id => id !== restaurantId));

      // Synchroniser avec Redux
      dispatch({ type: 'REMOVE_FAVORITE', payload: restaurantId });

      return { success: true };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Basculer l'état favoris
  const toggleFavorite = useCallback(async (restaurantId) => {
    if (isFavorite(restaurantId)) {
      return await removeFromFavorite(restaurantId);
    } else {
      return await addToFavorite(restaurantId);
    }
  }, [isFavorite, addToFavorite, removeFromFavorite]);

  // Synchroniser avec Redux au montage et quand Redux change
  useEffect(() => {
    if (reduxFavorites.length > 0 && favorites.length === 0) {
      setFavorites(reduxFavorites);
    }
  }, [reduxFavorites, favorites.length]);

  // Charger les favoris au montage du contexte
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const value = {
    favorites,
    loading,
    isFavorite,
    addToFavorite,
    removeFromFavorite,
    toggleFavorite,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

