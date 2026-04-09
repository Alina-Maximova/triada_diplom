import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const orangeLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#fa8a11',
    primaryContainer: '#FFE4CC',
    secondary: '#FF9D45',
    secondaryContainer: '#FFEDDC',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    background: '#FFFFFF',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1B1B1F',
    onSurfaceVariant: '#44464F',
    onBackground: '#1B1B1F',
    outline: '#757780',
    outlineVariant: '#C5C6D0',
    
    // Цвета статусов
    status: {
      completed: '#4CAF50',
      completedContainer: '#4CAF5020',
      inProgress: '#fa8a11',
      inProgressContainer: '#fa8a1120',
      paused: '#BA1A1A',
      pausedContainer: '#BA1A1A20',
      reportAdded: '#2196F3',
      reportAddedContainer: '#2196F320',
      accepted: '#2E7D32',
      acceptedContainer: '#2E7D3220',
      new: '#757780',
      newContainer: '#75778020',
       rejected: '#BA1A1A',
      rejectedContainer: '#BA1A1A20',
    }
  },
};

export const orangeDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ffca86',
    primaryContainer: '#C46A00',
    secondary: '#ffca86',
    secondaryContainer: '#8C4D00',
    surface: '#1B1B1F',
    surfaceVariant: '#2D2D32',
    background: '#121212',
    error: '#FFB4AB',
    errorContainer: '#93000A',
    onPrimary: '#3A2200',
    onSecondary: '#3A2200',
    onSurface: '#E4E2E6',
    onSurfaceVariant: '#C5C6D0',
    onBackground: '#E4E2E6',
    outline: '#8E9099',
    outlineVariant: '#44464F',
    
    // Цвета статусов для темной темы
    status: {
      completed: '#81C784',
      completedContainer: '#81C78420',
      inProgress: '#ffca86',
      inProgressContainer: '#ffca8620',
      paused: '#FFB4AB',
      pausedContainer: '#FFB4AB20',
      reportAdded: '#64B5F6',
      reportAddedContainer: '#64B5F620',
      accepted: '#A5D6A7',
      acceptedContainer: '#A5D6A720',
      new: '#8E9099',
      newContainer: '#8E909920',
             rejected: '#BA1A1A',
      rejectedContainer: '#BA1A1A20',
    }
  },
};

export type AppTheme = typeof orangeLightTheme;