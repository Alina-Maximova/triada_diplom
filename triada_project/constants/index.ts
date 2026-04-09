import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Автоматическое определение URL для разных сред
export const getApiBaseUrl = (): string => {
  // Для production используем прямой IP
  if (!__DEV__) {
    return 'http://192.168.0.100:5000';
  }
  
  // Для development
  if (Platform.OS === 'android') {
    return 'http://192.168.0.100:5000'; // Android эмулятор
  }
  
  return 'http://192.168.0.100:5000'; // iOS симулятор или другое
};

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || getApiBaseUrl();

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Triada-Mobile-App/1.0.0',
    'X-Requested-With': 'XMLHttpRequest'
  },
};

// Функция для тестирования соединения
export const testServerConnection = async (): Promise<{success: boolean; data?: any; error?: string}> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Triada-Connection-Test/1.0.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.name === 'AbortError' ? 'Timeout' : error.message 
    };
  }
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data'
};
