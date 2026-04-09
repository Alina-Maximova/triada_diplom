import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, LoginData } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { authAPI } from '@/services/user';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []); // Убрали зависимость от user

    const checkAuth = async () => {
        try {
            const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

            if (token && userData) {
                const decoded: any = jwtDecode(token);
                    const userFromToken: User = {
                id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                role_id: decoded.role_id,
                role_name: decoded.role_name,
            };
                    console.log(decoded)
                    setUser(userFromToken);
            }
        } catch (error) {
            console.log('Auth check:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: LoginData): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await authAPI.login(data);
            console.log(response.user)
            // Проверяем, успешен ли ответ (может быть success: false)
            if (!response.success) {
                throw new Error(response.error || 'Ошибка входа');
            }

            if (!response.token) {
                throw new Error('Сервер не вернул токен');
            }
            const decodedUser: any = jwtDecode(response.token);

            const userFromToken: User = {
                id: decodedUser.id,
                name: decodedUser.name,
                email: decodedUser.email,
                role_id: decodedUser.role_id,
                role_name: decodedUser.role_name,
            };
            if (userFromToken.role_name === "User") {
                throw new Error("Вы не работник")
            }
            await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, response.token);
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userFromToken));


            setUser(userFromToken);
            console.log(userFromToken)
            return { success: true };
        } catch (error: any) {
            // console.error('Login error:', error);
            let message = error.message || 'Ошибка входа';
            // Если ошибка от axios (сетевой сбой, 500 и т.п.) и есть ответ сервера
            if (error.response?.data?.error) {
                message = error.response.data.error;
            }
            return {
                success: false,
                message,
            };
        }
    };

    const logout = async (): Promise<void> => {
        try {
            // Очищаем SecureStore
            await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
            // Сбрасываем состояние
            setUser(null);
            console.log('User after logout:', null);
        } catch (error) {
            console.log('Logout error:', error);
            // Даже при ошибке очищаем локальные данные
            await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
            setUser(null);
        }
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
    };
};