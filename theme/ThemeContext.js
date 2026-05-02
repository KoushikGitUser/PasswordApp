import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';

const THEME_STORAGE_KEY = 'app_theme_mode';

const ThemeContext = createContext({
  theme: darkColors,
  themeMode: 'dark', // 'light', 'dark', or 'auto'
  isDark: true,
  setThemeMode: () => {},
  colors: darkColors,
});

export const AppThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark' from device
  const [themeMode, setThemeModeState] = useState('dark'); // User's choice
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system changes (only if mode is 'auto')
  useEffect(() => {
    if (themeMode === 'auto') {
      // Theme will update automatically via getActiveTheme
    }
  }, [systemColorScheme, themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
        setThemeModeState(savedMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode) => {
    try {
      if (['light', 'dark', 'auto'].includes(mode)) {
        setThemeModeState(mode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine active theme based on mode
  const getActiveTheme = () => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkColors : lightColors;
    }
    return themeMode === 'dark' ? darkColors : lightColors;
  };

  const isDark = () => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  };

  const value = {
    theme: getActiveTheme(),
    themeMode,
    isDark: isDark(),
    setThemeMode,
    colors: getActiveTheme(),
  };

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
