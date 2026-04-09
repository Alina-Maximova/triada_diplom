// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
        initialRouteName="(1tasks)"
      >
        <Tabs.Screen
          name="(1tasks)"
          options={{
            title: 'Задачи',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="assignment" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="(reports)"
          options={{
            title: 'Отчеты',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="description" size={size} color={color} />
            ),
            headerShown: false,
          }}
        />
        
        <Tabs.Screen
          name="(materials)"
          options={{
            title: 'Материалы',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="inventory" size={size} color={color} />
            ),
            href: null, // Это скрывает таб из панели
            headerShown: false,
           

          }}
        />
      </Tabs>
    </>
  );
}