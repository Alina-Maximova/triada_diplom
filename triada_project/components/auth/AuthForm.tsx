import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { LoginData } from '@/types';


interface AuthFormProps {
  onLogin: (data: LoginData) => Promise<void>;
  isLoading: boolean;
}

interface FormData {
  email: string;
  password: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await onLogin({ email: data.email, password: data.password });
      reset();
    } catch (error) {
      // Ошибка обрабатывается в родительском компоненте
      console.error('Auth error:', error);
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

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Некорректный email',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Email *"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.email}
                  style={styles.input}
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  left={<TextInput.Icon icon="email" />}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Пароль обязателен',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Пароль *"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.password}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  left={<TextInput.Icon icon="lock" />}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password.message}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Войти
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 8,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});