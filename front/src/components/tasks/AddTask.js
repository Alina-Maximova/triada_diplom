import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Row, Col, FormGroup, Label, Input, FormText, Button, Alert, Spinner
} from 'reactstrap';
import { toast } from 'react-toastify';
import { useAddTasksMutation, useUpdateTaskMutation } from '../../redux/apiSlice';
import MapPicker from './MapPicker';
import { encryptData, decryptData } from '../../utils/encryption';
const PHONE_PLACEHOLDER = '+7 (999) 999-99-99';
const PHONE_PATTERN = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const CUSTOMER_PATTERN = /^[а-яА-ЯёЁ\s-]{2,}$/;
const CUSTOMER_MIN_WORDS = 2;

const applyPhoneMask = (value) => {
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

const combineDateAndTime = (date, time) => {
  if (!date || !time) return null;
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
};

const validateCustomerName = (value) => {
  if (!value || !value.trim()) return 'ФИО обязательно';
  const trimmedValue = value.trim();
  if (trimmedValue.length < 2) return 'ФИО должно содержать минимум 2 символа';
  if (trimmedValue.length > 100) return 'ФИО не должно превышать 100 символов';
  if (!CUSTOMER_PATTERN.test(trimmedValue)) return 'ФИО может содержать только русские буквы, пробелы и дефисы';
  const words = trimmedValue.split(/\s+/).filter(word => word.length > 0);
  if (words.length < CUSTOMER_MIN_WORDS) return `Введите минимум ${CUSTOMER_MIN_WORDS} слова (например: Иван Иванов)`;
  for (let word of words) {
    if (word.length < 2) return `Каждое слово должно содержать минимум 2 символа (слово "${word}")`;
  }
  return true;
};

const AddTask = ({ onTaskCreated, initialData = null }) => {
  const [addTasks] = useAddTasksMutation();
  const [updateTask] = useUpdateTaskMutation();

  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapApiLoaded, setMapApiLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    reset
  } = useForm({
    defaultValues: initialData || {
      title: '',
      description: '',
      phone: '',
      customer: '',
      addressNote: '',
      start_date: null,
      due_date: null,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      dueTime: new Date(new Date().setHours(18, 0, 0, 0)),
      location: null,
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (initialData) {
      const formattedData = {
        ...initialData,
         phone: decryptData(initialData.phone),
      customer: decryptData(initialData.customer),
        start_date: initialData.start_date ? new Date(initialData.start_date) : null,
        due_date: initialData.due_date ? new Date(initialData.due_date) : null,
        startTime: initialData.start_date ? new Date(initialData.start_date) : new Date(new Date().setHours(9, 0, 0, 0)),
        dueTime: initialData.due_date ? new Date(initialData.due_date) : new Date(new Date().setHours(18, 0, 0, 0)),
        location: initialData.latitude ? {
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          address: initialData.address
        } : null
      };
      reset(formattedData);
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.REACT_APP_YANDEX_MAPS_API_KEY || '7f66d4c8-981a-4b98-b4b0-8bef0dae0b1c'}&lang=ru_RU`;
      script.onload = () => setMapApiLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Yandex Maps API');
        toast.error('Не удалось загрузить карту');
      };
      document.head.appendChild(script);
    } else {
      setMapApiLoaded(true);
    }
    return () => {
      const script = document.querySelector('script[src*="yandex.ru"]');
      if (script) document.head.removeChild(script);
    };
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

  const isFormValid = Boolean(
    title?.trim() && customer?.trim() && phone?.trim() && description?.trim() &&
    start_date && due_date && startTime && dueTime && currentLocation &&
    PHONE_PATTERN.test(phone) &&
    combineDateAndTime(start_date, startTime) < combineDateAndTime(due_date, dueTime) &&
    validateCustomerName(customer) === true
  );

  const handlePhoneChange = (value, onChange) => {
    onChange(applyPhoneMask(value));
  };

  const handleCustomerChange = (value, onChange) => {
    onChange(value);
    if (value.trim()) setTimeout(() => trigger('customer'), 100);
  };

  const handleOpenMap = () => {
    if (mapApiLoaded) setMapPickerVisible(true);
    else toast.warning('Карта загружается...');
  };

  const handleMapLocationSelect = (location) => {
    setValue('location', location, { shouldValidate: true });
    setMapPickerVisible(false);
    toast.success('Местоположение выбрано');
  };

  const removeLocation = () => {
    setValue('location', null, { shouldValidate: true });
    toast.info('Местоположение удалено');
  };

  const handleCancelEdit = () => {
    reset({
      title: '', description: '', phone: '', customer: '', addressNote: '',
      start_date: null, due_date: null,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      dueTime: new Date(new Date().setHours(18, 0, 0, 0)),
      location: null,
    });
    if (onTaskCreated) onTaskCreated();
    toast.info('Редактирование отменено');
  };

  const handleResetForm = () => {
    if (initialData) {
      const formattedData = {
        ...initialData,
        start_date: initialData.start_date ? new Date(initialData.start_date) : null,
        due_date: initialData.due_date ? new Date(initialData.due_date) : null,
        startTime: initialData.start_date ? new Date(initialData.start_date) : new Date(new Date().setHours(9, 0, 0, 0)),
        dueTime: initialData.due_date ? new Date(initialData.due_date) : new Date(new Date().setHours(18, 0, 0, 0)),
        location: initialData.latitude ? {
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          address: initialData.address
        } : null
      };
      reset(formattedData);
      toast.info('Форма сброшена');
    } else {
      reset({
        title: '', description: '', phone: '', customer: '', addressNote: '',
        start_date: null, due_date: null,
        startTime: new Date(new Date().setHours(9, 0, 0, 0)),
        dueTime: new Date(new Date().setHours(18, 0, 0, 0)),
        location: null,
      });
      toast.info('Форма очищена');
    }
  };

  const onSubmit = async (data) => {
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);
      const startDateTime = combineDateAndTime(data.start_date, data.startTime);
      const dueDateTime = combineDateAndTime(data.due_date, data.dueTime);
      if (dueDateTime <= startDateTime) {
        toast.error('Дата окончания должна быть позже даты начала');
        return;
      }

      const taskData = {
        title: data.title.trim(),
        description: data.description.trim(),
         phone: encryptData(data.phone),            
    customer: encryptData(data.customer.trim()), 
        address: data.location?.address || '',
        addressNote: data.addressNote?.trim() || '',
        location: data.location,
        start_date: startDateTime.toISOString(),
        due_date: dueDateTime.toISOString(),
      };

      if (initialData) {
        const result = await updateTask({ id: initialData.id, data: taskData }).unwrap();
        if (result.success) {
          toast.success('Задача обновлена');
        } else {
          toast.error(result.error || 'Ошибка обновления');
          return;
        }
      } else {
        const result = await addTasks({ ...taskData, status: 'new' }).unwrap();
        if (result.success) {
          toast.success('Задача создана');
        } else {
          toast.error(result.error || 'Ошибка создания');
          return;
        }
      }

      reset({
        title: '', description: '', phone: '', customer: '', addressNote: '',
        start_date: null, due_date: null,
        startTime: new Date(new Date().setHours(9, 0, 0, 0)),
        dueTime: new Date(new Date().setHours(18, 0, 0, 0)),
        location: null,
      });
      if (onTaskCreated) onTaskCreated();

    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.data?.message || error.data?.error || `Не удалось ${initialData ? 'обновить' : 'создать'} задачу`;
      toast.error(`Ошибка: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="add-task-header">
        <h4>{initialData ? 'Редактировать задачу' : 'Создать новую задачу'}</h4>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="task-form">
        <Row>
          <Col md={6}>
            <FormGroup>
              <Label for="title">
                Название задачи <span className="required">*</span>
              </Label>
              <Controller
                name="title"
                control={control}
                rules={{
                  required: 'Название обязательно',
                  minLength: { value: 2, message: 'Минимум 2 символа' }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Например: Покраска стен в квартире"
                    invalid={!!errors.title}
                    valid={field.value && !errors.title}
                  />
                )}
              />
              {errors.title && <FormText color="danger">{errors.title.message}</FormText>}
            </FormGroup>
          </Col>

          <Col md={6}>
            <FormGroup>
              <Label for="customer">
                ФИО заказчика <span className="required">*</span>
              </Label>
              <Controller
                name="customer"
                control={control}
                rules={{
                  required: 'ФИО обязательно',
                  validate: validateCustomerName
                }}
                render={({ field }) => (
                  <div>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Например: Иванов Иван Иванович"
                      onChange={(e) => handleCustomerChange(e.target.value, field.onChange)}
                      invalid={!!errors.customer}
                      valid={field.value && !errors.customer && validateCustomerName(field.value) === true}
                    />
                    {field.value && !errors.customer && (
                      <FormText color="success" className="mt-1">
                        ✓ Корректный формат ФИО
                      </FormText>
                    )}
                  </div>
                )}
              />
              {errors.customer && (
                <FormText color="danger" className="mt-1">
                  {errors.customer.message}
                </FormText>
              )}
              {!errors.customer && (
                <FormText color="muted" className="mt-1">
                  Введите минимум 2 слова на русском языке (например: Иванов Иван)
                </FormText>
              )}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <FormGroup>
              <Label for="phone">
                Номер телефона <span className="required">*</span>
              </Label>
              <Controller
                name="phone"
                control={control}
                rules={{
                  required: 'Номер телефона обязателен',
                  pattern: {
                    value: PHONE_PATTERN,
                    message: 'Введите номер в формате +7 (999) 999-99-99'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="tel"
                    placeholder={PHONE_PLACEHOLDER}
                    onChange={(e) => handlePhoneChange(e.target.value, field.onChange)}
                    invalid={!!errors.phone}
                    valid={field.value && !errors.phone && PHONE_PATTERN.test(field.value)}
                  />
                )}
              />
              {errors.phone && <FormText color="danger">{errors.phone.message}</FormText>}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <FormGroup>
              <Label for="description">
                Описание работ <span className="required">*</span>
              </Label>
              <Controller
                name="description"
                control={control}
                rules={{
                  required: 'Описание обязательно',
                  minLength: { value: 10, message: 'Минимум 10 символов' }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="textarea"
                    rows={3}
                    placeholder="Подробное описание работ, материалов, требований..."
                    invalid={!!errors.description}
                    valid={field.value && !errors.description}
                  />
                )}
              />
              {errors.description && <FormText color="danger">{errors.description.message}</FormText>}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <FormGroup>
              <Label for="addressNote">Примечание к адресу (опционально)</Label>
              <Controller
                name="addressNote"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Подъезд, этаж, код домофона, особенности доступа..."
                  />
                )}
              />
              <FormText color="muted">
                Укажите дополнительную информацию для нахождения объекта
              </FormText>
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <FormGroup>
              <Label>Дата и время начала *</Label>
              <div className="date-time-row">
                <div className="mb-2">
                  <Label className="small">Дата начала</Label>
                  <Controller
                    name="start_date"
                    control={control}
                    rules={{ required: 'Дата начала обязательна' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                          setValue('due_date', date);
                          trigger('due_date');
                        }}
                        dateFormat="dd.MM.yyyy"
                        placeholderText="Выберите дату"
                        minDate={new Date()}
                        className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                      />
                    )}
                  />
                  {errors.start_date && <FormText color="danger">{errors.start_date.message}</FormText>}
                </div>

                <div>
                  <Label className="small">Время начала</Label>
                  <Controller
                    name="startTime"
                    control={control}
                    rules={{ required: 'Время начала обязательно' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Время"
                        dateFormat="HH:mm"
                        placeholderText="Выберите время"
                        className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                      />
                    )}
                  />
                  {errors.startTime && <FormText color="danger">{errors.startTime.message}</FormText>}
                </div>
              </div>
            </FormGroup>
          </Col>

          <Col md={6}>
            <FormGroup>
              <Label>Дата и время окончания *</Label>
              <div className="date-time-row">
                <div className="mb-2">
                  <Label className="small">Дата окончания</Label>
                  <Controller
                    name="due_date"
                    control={control}
                    rules={{ required: 'Дата окончания обязательна' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        dateFormat="dd.MM.yyyy"
                        placeholderText="Выберите дату"
                        minDate={start_date || new Date()}
                        className={`form-control ${errors.due_date ? 'is-invalid' : ''}`}
                      />
                    )}
                  />
                  {errors.due_date && <FormText color="danger">{errors.due_date.message}</FormText>}
                </div>

                <div>
                  <Label className="small">Время окончания</Label>
                  <Controller
                    name="dueTime"
                    control={control}
                    rules={{ required: 'Время окончания обязательно' }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Время"
                        dateFormat="HH:mm"
                        placeholderText="Выберите время"
                        className={`form-control ${errors.dueTime ? 'is-invalid' : ''}`}
                      />
                    )}
                  />
                  {errors.dueTime && <FormText color="danger">{errors.dueTime.message}</FormText>}
                </div>
              </div>
            </FormGroup>
          </Col>
        </Row>

        {start_date && due_date && startTime && dueTime &&
          combineDateAndTime(start_date, startTime) >= combineDateAndTime(due_date, dueTime) && (
            <Row>
              <Col md={12}>
                <Alert color="warning" className="py-2">
                  Дата и время окончания должны быть позже даты и времени начала
                </Alert>
              </Col>
            </Row>
          )}

        <Row>
          <Col md={12}>
            <FormGroup>
              <Label>Местоположение <span className="required">*</span></Label>
              {currentLocation ? (
                <div className="location-card">
                  <div className="location-actions mb-2">
                    <Button
                      type="button"
                      onClick={handleOpenMap}
                      color="outline-primary"
                      size="sm"
                      className="mr-2"
                      style={{ borderColor: '#ef8810', color: '#ef8810' }}
                    >
                      Изменить местоположение
                    </Button>
                    <Button
                      type="button"
                      onClick={removeLocation}
                      color="outline-danger"
                      size="sm"
                    >
                      Удалить
                    </Button>
                  </div>
                  {currentLocation.address && (
                    <div className="location-address mb-2">
                      <strong>Адрес:</strong> {currentLocation.address}
                    </div>
                  )}
                  <div className="location-coords text-muted">
                    <strong>Координаты:</strong> Широта: {Number(currentLocation.latitude).toFixed(6)},
                    Долгота: {Number(currentLocation.longitude).toFixed(6)}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleOpenMap}
                  color="outline-secondary"
                  className="w-100 py-2"
                >
                  Выбрать местоположение на карте *
                </Button>
              )}
              {errors.location && <FormText color="danger">{errors.location.message}</FormText>}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12} className="mt-3">
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="secondary"
                onClick={handleResetForm}
                disabled={isSubmitting}
              >
                {initialData ? 'Сбросить' : 'Очистить'}
              </Button>

              {initialData && (
                <Button
                  type="button"
                  color="outline-secondary"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  style={{ borderColor: '#6c757d', color: '#6c757d' }}
                >
                  Отменить
                </Button>
              )}

              <Button
                type="submit"
                color="primary"
                disabled={isSubmitting || !isFormValid}
                style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {initialData ? 'Сохранение...' : 'Создание...'}
                  </>
                ) : (
                  initialData ? 'Сохранить' : 'Создать'
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </form>

      {mapApiLoaded && (
        <MapPicker
          visible={mapPickerVisible}
          onSelect={handleMapLocationSelect}
          onClose={() => setMapPickerVisible(false)}
          initialLocation={currentLocation}
        />
      )}
    </>
  );
};

export default AddTask;