// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

const initialState = {
  token: null,
  user: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token } = action.payload;
      state.token = token;
      try {
        // Декодируем токен и проверяем срок действия
        const decoded = jwtDecode(token);
        // Если токен просрочен, jwtDecode выбросит ошибку
        state.user = decoded;
      } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        state.user = null;
        state.token = null;
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;