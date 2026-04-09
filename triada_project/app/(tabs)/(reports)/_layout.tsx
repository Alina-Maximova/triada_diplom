// app/(tabs)/_layout.tsx
import { Stack, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const theme = useTheme();
  

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      
      <Stack screenOptions={{
        // Используем цвета из темы телефона
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.onSurface, // ФИКС: Добавлен цвет для стрелки
        // Фон контента
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        
        <Stack.Screen 
          name="create-report" 
          options={{ 
            title: 'Создание отчета',
           headerShown: false, // У нас есть свой Appbar на странице
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.onSurface, // ФИКС: Добавлен цвет для стрелки
          }} 
        />
        <Stack.Screen 
        name="report-detail" 
        options={{ 
          title: 'Отчет по задачи',
          presentation: 'modal',
           headerShown: false, // У нас есть свой Appbar на странице
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      </Stack>
    </>
  );
}