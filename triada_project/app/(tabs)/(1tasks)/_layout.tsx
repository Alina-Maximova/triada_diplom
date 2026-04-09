import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function TasksLayout() {
  const theme = useTheme();

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.background,
      },
      headerTintColor: theme.colors.onSurface,
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
        name="create" 
        options={{ 
          title: 'Создание задачи',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Редактирование задачи',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
       <Stack.Screen 
        name="comments" 
        options={{ 
          title: 'Комментарии к задачи',
          presentation: 'modal',
           headerShown: false, // У нас есть свой Appbar на странице

          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      <Stack.Screen 
        name="detail" 
        options={{ 
          title: 'Детали задачи',
          presentation: 'modal',
           headerShown: false, // У нас есть свой Appbar на странице
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
       <Stack.Screen 
        name="files" 
        options={{ 
          title: 'Файлы задачи',
          presentation: 'modal',
           headerShown: false, // У нас есть свой Appbar на странице
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      
    </Stack>
  );
}