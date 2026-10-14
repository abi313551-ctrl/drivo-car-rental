import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cars as seedCars } from '../data/cars.js';
import { load, save } from '../services/storageService.js';
import { apiRequest, getToken } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const CarContext = createContext(null);
const validIds = (v) => Array.isArray(v) && v.every(Number.isInteger);

export function CarProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cars, setCars] = useState(() => load('cars', seedCars, Array.isArray));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => load('favorites', [], validIds));

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/cars');
      if (Array.isArray(data.cars) && data.cars.length) {
        setCars(data.cars);
        save('cars', data.cars);
      }
    } catch {
      // Fallback to local seed dataset if backend is unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    if (!isAuthenticated || !getToken()) return;
    apiRequest('/favorites')
      .then((data) => {
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
          save('favorites', data.favorites);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => { save('favorites', favorites); }, [favorites]);

  const toggleFavorite = useCallback(async (id) => {
    const has = favorites.includes(id);
    const next = has ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next);
    toast(has ? 'Removed from favorites' : 'Added to favorites', { icon: has ? '💔' : '❤️' });

    if (isAuthenticated && getToken()) {
      try {
        const res = await apiRequest(`/favorites/${id}`, { method: 'POST' });
        if (Array.isArray(res.favorites)) setFavorites(res.favorites);
      } catch {
        // Keep optimistic local update
      }
    }
  }, [favorites, isAuthenticated]);

  const clearFavorites = useCallback(async () => {
    setFavorites([]);
    if (isAuthenticated && getToken()) {
      try { await apiRequest('/favorites', { method: 'DELETE' }); } catch { /* ignore */ }
    }
  }, [isAuthenticated]);

  const addCar = useCallback(async (carPayload) => {
    const res = await apiRequest('/cars', { method: 'POST', body: carPayload });
    setCars((prev) => {
      const next = [...prev, res.car];
      save('cars', next);
      return next;
    });
    return res.car;
  }, []);

  const toggleCarAvailability = useCallback(async (carId, available) => {
    try {
      const res = await apiRequest(`/cars/${carId}/availability?available=${available}`, { method: 'PATCH' });
      setCars((prev) => prev.map((c) => (c.id === carId ? res.car : c)));
      return res.car;
    } catch {
      setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, available } : c)));
    }
  }, []);

  const value = useMemo(() => ({
    cars,
    loading,
    error,
    refreshCars: fetchCars,
    favorites,
    favoriteCars: cars.filter((c) => favorites.includes(c.id)),
    isFavorite: (id) => favorites.includes(id),
    toggleFavorite,
    clearFavorites,
    addCar,
    toggleCarAvailability,
    getCarById: (id) => cars.find((c) => c.id === Number(id)),
  }), [cars, loading, error, fetchCars, favorites, toggleFavorite, clearFavorites, addCar, toggleCarAvailability]);

  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;
}

export function useCars() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error('useCars must be used inside <CarProvider>');
  return ctx;
}
