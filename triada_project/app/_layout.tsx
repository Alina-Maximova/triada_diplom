import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, Text } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { useTasks } from '@/hooks/useTasks';
import { useReports } from '@/hooks/useReports';
import { useMaterials } from '@/hooks/useMaterials';

LogBox.ignoreLogs(['[Reanimated]']);

function LoadingScreen() {
  const { theme } = useTheme();
  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 16,
      color: theme.colors.onSurface,
    },
  });

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Загрузка...</Text>
    </View>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const { refreshTasks } = useTasks();
  const { loadReports } = useReports();
  const { loadAvailableMaterials } = useMaterials();
  const afterSync = () => {
    if (user) {
      refreshTasks();
      loadReports();
      loadAvailableMaterials();
    }
  };
  console.log(user)

  useNetworkSync(afterSync);
  const { theme } = useTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar
        style={theme.dark ? 'light' : 'dark'}
        backgroundColor={theme.colors.background}
      />
      {!user ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      )}
    </>
  );
}

function AppWithPaper() {
  const { theme } = useTheme();
  return (
    <PaperProvider theme={theme}>
      <AppContent />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppWithPaper />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}