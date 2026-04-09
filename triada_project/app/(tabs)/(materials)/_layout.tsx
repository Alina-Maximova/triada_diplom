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
        name="add-materials" 
        options={{ 
          title: 'Добавление метериала',
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