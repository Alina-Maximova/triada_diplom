// app/index.tsx (AuthScreen)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import { TextInput, Button, Text, Card, Snackbar, useTheme } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { LoginData } from '@/types';
import { useRouter } from 'expo-router';
import { AuthScreenStyles } from "@/styles/auth/AuthScreenStyles"

function AuthScreen() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const theme = useTheme();
  const styles = AuthScreenStyles(theme);

  useEffect(() => {
    if (user) {
      console.log(user)
      console.log('User authenticated, redirecting to tasks...');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setSnackbarMessage('Заполните все обязательные поля');
      setSnackbarVisible(true);
      return;
    }

    try {
      const loginData: LoginData = {
        username: formData.username,
        password: formData.password
      };

      const result = await login(loginData);

      console.log('Auth result:', result);

      if (!result.success) {
      // console.log('Auth error:', result.message);

        setSnackbarMessage(result.message || 'Произошла ошибка');
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage('Вход выполнен!');
        setSnackbarVisible(true);
      }
    } catch (error: any) {
      // console.log('Auth error:', error);
      setSnackbarMessage(error.message || 'Произошла ошибка');
      setSnackbarVisible(true);
    }
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Вход в систему
            </Text>

            <TextInput
              label="Логин"
              value={formData.username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              style={styles.input}
              mode="outlined"
              autoCapitalize="none"
              left={<TextInput.Icon icon="username" />}
            />

            <TextInput
              label="Пароль"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              labelStyle={{
                fontSize: 18,
                fontWeight: '600',
                lineHeight: 24,
              }}
            >
              Войти
            </Button>


          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

export default AuthScreen;