import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import {
  Appbar,
  Text,
  TextInput,
  Button,
  Chip,
  Card,
  useTheme,
  Snackbar,
  ActivityIndicator
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasks } from '@/hooks/useTasks';
import { CreateTaskData, Location as LocationType, Task } from '@/types';
import { YandexMapWebPicker } from '@/components/YandexMapPicker';
import { TaskFormStyles } from '@/styles/task/TaskFormStyles';

interface FormData {
  title: string;
  description: string;
  phone: string;
  customer: string;
  start_date: Date | null;
  due_date: Date | null;
  startTime: Date | null;
  dueTime: Date | null;
  location: LocationType | null;
  addressNote: string; // Добавляем поле для примечания к адресу
}

const PHONE_PLACEHOLDER = '+7 (999) 999-99-99';
const PHONE_PATTERN = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

const applyPhoneMask = (value: string): string => {
  const numbers = value.replace(/[^\d+]/g, '');
  let processed = numbers;

  if (!processed.startsWith('+7') && !processed.startsWith('7') && !processed.startsWith('8')) {
    processed = '+7' + processed;
  } else if (processed.startsWith('7')) {
    processed = '+' + processed;
  } else if (processed.startsWith('8')) {
    processed = '+7' + processed.slice(1);
  }

  const limited = processed.slice(0, 12);
  if (limited.length <= 2) return limited;

  const digits = limited.slice(2).replace(/\D/g, '');
  let result = '+7';

  if (digits.length > 0) {
    result += ' (';
    result += digits.slice(0, 3);
  }
  if (digits.length > 3) {
    result += ') ';
    result += digits.slice(3, 6);
  }
  if (digits.length > 6) {
    result += '-';
    result += digits.slice(6, 8);
  }
  if (digits.length > 8) {
    result += '-';
    result += digits.slice(8, 10);
  }

  return result;
};

const combineDateAndTime = (date: Date, time: Date): Date => {
  const combined = new Date(date);
  combined.setHours(time.getHours());
  combined.setMinutes(time.getMinutes());
  combined.setSeconds(0);
  combined.setMilliseconds(0);
  return combined;
};

const splitDateTime = (isoString: string): { date: Date; time: Date } => {
  const date = new Date(isoString);
  const time = new Date(2024, 0, 1, date.getHours(), date.getMinutes());
  return { date, time };
};

export default function EditTaskScreen() {
  const theme = useTheme();
  const styles = TaskFormStyles(theme);
  const { updateTask } = useTasks();
  const { task: taskParam } = useLocalSearchParams();

  // Обрабатываем параметр как массив
  const taskData = taskParam
    ? JSON.parse(Array.isArray(taskParam) ? taskParam[0] : taskParam) as Task
    : null;

  console.log('Task data:', taskData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      phone: '',
      customer: '',
      start_date: null,
      due_date: null,
      startTime: new Date(2024, 0, 1, 9, 0),
      dueTime: new Date(2024, 0, 1, 18, 0),
      location: null,
      addressNote: '', // Добавляем поле по умолчанию
    },
    mode: 'onChange',
  });

  // Заполняем форму данными задачи
  useEffect(() => {
    if (taskData) {
      console.log('Заполняем форму данными задачи:', taskData);

      const startDateTime = taskData.start_date ? splitDateTime(taskData.start_date) : null;
      const dueDateTime = taskData.due_date ? splitDateTime(taskData.due_date) : null;

      const location = (taskData.latitude !== undefined && taskData.longitude !== undefined)
        ? {
          latitude: taskData.latitude,
          longitude: taskData.longitude,
          address: taskData.address || ''
        }
        : null;

      reset({
        title: taskData.title || '',
        description: taskData.description || '',
        phone: taskData.phone ? applyPhoneMask(taskData.phone) : '',
        customer: taskData.customer || '',
        start_date: startDateTime?.date || null,
        due_date: dueDateTime?.date || null,
        startTime: startDateTime?.time || new Date(2024, 0, 1, 9, 0),
        dueTime: dueDateTime?.time || new Date(2024, 0, 1, 18, 0),
        location: location,
        addressNote: taskData.addressNote || '', // Добавляем поле для примечания к адресу
      });
      setIsLoading(false);
    } else {
      console.log('Данные задачи не получены');
      setIsLoading(false);
    }
  }, []);

  const currentLocation = watch('location');
  const start_date = watch('start_date');
  const due_date = watch('due_date');
  const startTime = watch('startTime');
  const dueTime = watch('dueTime');
  const title = watch('title');
  const customer = watch('customer');
  const phone = watch('phone');
  const description = watch('description');
  const addressNote = watch('addressNote'); // Получаем значение примечания

  const isFormValid =
    title?.trim() &&
    customer?.trim() &&
    phone?.trim() &&
    description?.trim() &&
    start_date &&
    due_date &&
    startTime &&
    dueTime &&
    currentLocation &&
    PHONE_PATTERN.test(phone) &&
    combineDateAndTime(start_date, startTime) < combineDateAndTime(due_date, dueTime);

  const handlePhoneChange = (text: string, onChange: (value: string) => void) => {
    const formatted = applyPhoneMask(text);
    onChange(formatted);
  };

  const handleOpenMap = () => {
    setMapPickerVisible(true);
  };

  const handleMapLocationSelect = (location: LocationType) => {
    setValue('location', location, { shouldValidate: true });
    setMapPickerVisible(false);
  };

  const handleCloseMap = () => {
    setMapPickerVisible(false);
  };

  const removeLocation = () => {
    setValue('location', null, { shouldValidate: true });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Выбрать дату';
    return date.toLocaleDateString('ru-RU');
  };

  const formatTime = (time: Date | null) => {
    if (!time) return 'Выбрать время';
    return time.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleStartDateChange = (event: any, date?: Date) => {
    setShowStartDatePicker(false);
    if (date) {
      setValue('start_date', date, { shouldValidate: true });
      const due_date = watch('due_date');
      if (!due_date || due_date < date) {
        setValue('due_date', date, { shouldValidate: true });
      }
    }
  };

  const handleDueDateChange = (event: any, date?: Date) => {
    setShowDueDatePicker(false);
    if (date) {
      setValue('due_date', date, { shouldValidate: true });
    }
  };

  const handleStartTimeChange = (event: any, time?: Date) => {
    setShowStartTimePicker(false);
    if (time) {
      setValue('startTime', time, { shouldValidate: true });
    }
  };

  const handleDueTimeChange = (event: any, time?: Date) => {
    setShowDueTimePicker(false);
    if (time) {
      setValue('dueTime', time, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!isFormValid || !taskData) return;

    try {
      setIsSubmitting(true);

      const startDateTime = combineDateAndTime(data.start_date!, data.startTime!);
      const dueDateTime = combineDateAndTime(data.due_date!, data.dueTime!);

      if (dueDateTime <= startDateTime) {
        Alert.alert('Ошибка', 'Дата и время окончания должны быть позже даты и времени начала');
        return;
      }

      const submitData: CreateTaskData = {
        title: data.title.trim(),
        description: data.description.trim(),
        phone: data.phone,
        customer: data.customer.trim(),
        location: data.location!,
        start_date: startDateTime.toISOString(),
        due_date: dueDateTime.toISOString(),
        addressNote: data.addressNote.trim(), // Добавляем примечание к адресу
      };

      await updateTask(taskData.id, submitData);
      setSnackbarMessage('Задача успешно обновлена');

      setTimeout(() => {
        router.back();
      }, 1500);

    } catch (error: any) {
      console.error('Error updating task:', error);
      setSnackbarMessage(error.message || 'Не удалось обновить задачу');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>

        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Загрузка данных задачи...</Text>
        </View>
      </View>
    );
  }

  if (!taskData) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleCancel} />
          <Appbar.Content title="Ошибка" />
        </Appbar.Header>
        <View style={styles.center}>
          <Text>Задача не найдена</Text>
          <Text variant="bodySmall" style={{ marginTop: 8, textAlign: 'center' }}>
            Не удалось загрузить данные задачи.
            Пожалуйста, вернитесь назад и попробуйте снова.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>


      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Название задачи */}
        <Controller
          control={control}
          name="title"
          rules={{
            required: 'Название обязательно',
            minLength: { value: 2, message: 'Минимум 2 символа' },
            validate: (value) => value.trim() !== '' || 'Название не может быть пустым'
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Название задачи *"
              value={value}
              onChangeText={onChange}
              error={!!errors.title}
              style={styles.input}
              mode="outlined"
              maxLength={100}
            />
          )}
        />
        {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

        {/* ФИО заказчика */}
        <Controller
          control={control}
          name="customer"
          rules={{
            required: 'ФИО заказчика обязательно',
            minLength: { value: 2, message: 'Минимум 2 символа' },
            validate: (value) => value.trim() !== '' || 'ФИО не может быть пустым'
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="ФИО заказчика *"
              value={value}
              onChangeText={onChange}
              error={!!errors.customer}
              style={styles.input}
              mode="outlined"
              maxLength={50}
            />
          )}
        />
        {errors.customer && <Text style={styles.error}>{errors.customer.message}</Text>}

        {/* Номер телефона */}
        <Controller
          control={control}
          name="phone"
          rules={{
            required: 'Номер телефона обязателен',
            pattern: {
              value: PHONE_PATTERN,
              message: 'Введите номер в формате +7 (999) 999-99-99'
            }
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Номер телефона *"
              value={value}
              onChangeText={(text) => handlePhoneChange(text, onChange)}
              error={!!errors.phone}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={18}
              placeholder={PHONE_PLACEHOLDER}
            />
          )}
        />
        {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

        {/* Описание */}
        <Controller
          control={control}
          name="description"
          rules={{
            required: 'Описание обязательно',
            minLength: { value: 10, message: 'Минимум 10 символов' },
            validate: (value) => value.trim() !== '' || 'Описание не может быть пустым'
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Описание работ *"
              value={value}
              onChangeText={onChange}
              error={!!errors.description}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          )}
        />
        {errors.description && <Text style={styles.error}>{errors.description.message}</Text>}

        {/* Примечание к адресу (опционально) */}
        <Controller
          control={control}
          name="addressNote"
          // Нет правил валидации - поле не обязательное
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Примечание к адресу (опционально)"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              maxLength={500}
              placeholder="Уточните детали адреса, подъезд, этаж, код домофона и т.д."
            />
          )}
        />

        {/* Даты и время */}
        <View style={styles.dateTimeSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Дата и время начала *
          </Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <Chip
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={[styles.chip, !start_date && styles.requiredChip]}
              >
                {formatDate(start_date)}
              </Chip>
            </View>
            <View style={styles.dateTimeField}>
              <Chip
                mode="outlined"
                onPress={() => setShowStartTimePicker(true)}
                style={[styles.chip, !startTime && styles.requiredChip]}
              >
                {formatTime(startTime)}
              </Chip>
            </View>
          </View>
        </View>

        <View style={styles.dateTimeSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Дата и время окончания *
          </Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <Chip
                mode="outlined"
                onPress={() => setShowDueDatePicker(true)}
                style={[styles.chip, !due_date && styles.requiredChip]}
              >
                {formatDate(due_date)}
              </Chip>
            </View>
            <View style={styles.dateTimeField}>
              <Chip
                mode="outlined"
                onPress={() => setShowDueTimePicker(true)}
                style={[styles.chip, !dueTime && styles.requiredChip]}
              >
                {formatTime(dueTime)}
              </Chip>
            </View>
          </View>
        </View>

        {start_date && due_date && startTime && dueTime &&
          combineDateAndTime(start_date, startTime) >= combineDateAndTime(due_date, dueTime) && (
            <Text style={styles.dateError}>
              Дата и время окончания должны быть позже даты и времени начала
            </Text>
          )}

        {/* Местоположение */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Местоположение *
        </Text>

        {currentLocation ? (
          <Card style={styles.locationCard}>
            <Card.Content>
              <View style={styles.locationHeader}>
                <Button mode="text" onPress={handleOpenMap} textColor="#0163cafc">
                  Изменить
                </Button>
                <Button mode="text" onPress={removeLocation} textColor="#b23932ff">
                  Удалить
                </Button>
              </View>
              {currentLocation.address && (
                <Text variant="bodyMedium" style={styles.locationAddress}>
                  {currentLocation.address}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.locationCoords}>
                Широта: {Number(currentLocation.latitude).toFixed(6)},
                Долгота: {Number(currentLocation.longitude).toFixed(6)}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.locationButtons}>
            <Button
              mode="outlined"
              onPress={handleOpenMap}
              icon="map"
              style={styles.locationButton}
            >
              Выбрать на карте *
            </Button>
          </View>
        )}
        {errors.location && <Text style={styles.error}>{errors.location.message}</Text>}

        {/* Кнопки */}
        <View style={styles.buttons}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.button}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting || !isFormValid}
            style={styles.button}
          >
            Обновить задачу
          </Button>
        </View>
      </ScrollView>

      {/* DateTime Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={start_date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showDueDatePicker && (
        <DateTimePicker
          value={due_date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDueDateChange}
          minimumDate={start_date || new Date()}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
          is24Hour={true}
        />
      )}

      {showDueTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDueTimeChange}
          is24Hour={true}
        />
      )}

      {/* Map Picker */}
      <YandexMapWebPicker
        visible={mapPickerVisible}
        onLocationSelect={handleMapLocationSelect}
        onDismiss={handleCloseMap}
        initialLocation={currentLocation}
      />

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}