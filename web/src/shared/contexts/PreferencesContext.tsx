import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UserPreferences, PreferenceKey } from '@shared/types/preferences';
import { defaultPreferences } from '@shared/types/preferences';

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends PreferenceKey>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'retorrent-preferences';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored) as Partial<UserPreferences>;
        // Merge with defaults to ensure all keys are present
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Failed to save preferences to localStorage:', error);
      }
    }
  }, [preferences, isLoading]);

  const updatePreference = useMemo(
    () =>
      <K extends PreferenceKey>(key: K, value: UserPreferences[K]) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
      },
    []
  );

  const resetPreferences = useMemo(
    () => () => {
      setPreferences(defaultPreferences);
    },
    []
  );

  const value = useMemo(
    () => ({
      preferences,
      updatePreference,
      resetPreferences,
      isLoading,
    }),
    [preferences, updatePreference, resetPreferences, isLoading]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}