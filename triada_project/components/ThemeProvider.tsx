import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { orangeLightTheme, orangeDarkTheme, AppTheme } from '@/constants/theme';

type ThemeType = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: AppTheme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('auto');

  const getCurrentTheme = (): AppTheme => {
    if (themeType === 'auto') {
      return systemColorScheme === 'dark' ? orangeDarkTheme : orangeLightTheme;
    }
    return themeType === 'dark' ? orangeDarkTheme : orangeLightTheme;
  };

  const theme = getCurrentTheme();

  const toggleTheme = () => {
    setThemeType(current => {
      if (current === 'auto') return 'light';
      if (current === 'light') return 'dark';
      return 'auto';
    });
  };

  useEffect(() => {
    if (themeType === 'auto') {
      // Тема автоматически обновится через getCurrentTheme
    }
  }, [systemColorScheme, themeType]);

  return (
    <ThemeContext.Provider value={{ theme, themeType, setThemeType, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};