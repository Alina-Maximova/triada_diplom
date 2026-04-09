import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAddUserMutation } from '../../redux/apiSlice';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Spinner,
  Row,
  Col,
  FormText
} from 'reactstrap';

const AddUser = () => {
  const [formData, setFormData] = useState({
    surname: '',
    name: '',
    patronymic: '',
    username: '',
    email: '',
    password: '',
    role_id: '2' // По умолчанию роль Employee
  });
  
  const [validationErrors, setValidationErrors] = useState({
    surname: '',
    name: '',
    patronymic: '',
    username: '',
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [addUser, { isLoading }] = useAddUserMutation();

  const roles = [
    { id: '1', name: 'Admin', description: 'Администратор' },
    { id: '2', name: 'Employee', description: 'Сотрудник' }
  ];

  // Валидация отдельного поля
  const validateField = (name, value) => {
    let error = '';
    const trimmedValue = value.trim();
    
    switch (name) {
      case 'surname':
      case 'name':
        if (!trimmedValue) {
          error = 'Поле обязательно для заполнения';
        } else if (trimmedValue.length < 2) {
          error = 'Минимум 2 символа';
        } else if (trimmedValue.length > 50) {
          error = 'Максимум 50 символов';
        } else if (!/^[а-яА-ЯёЁ\-]+$/.test(trimmedValue)) {
          error = 'Только русские буквы и дефис';
        } else if (trimmedValue.startsWith('-') || trimmedValue.endsWith('-')) {
          error = 'Дефис не может быть в начале или конце';
        } else if (trimmedValue.includes('--')) {
          error = 'Не может быть двух дефисов подряд';
        }
        break;
        
      case 'patronymic':
        if (!trimmedValue) {
          error = 'Поле обязательно для заполнения';
        } else if (trimmedValue.length < 2) {
          error = 'Минимум 2 символа';
        } else if (trimmedValue.length > 50) {
          error = 'Максимум 50 символов';
        } else if (!/^[а-яА-ЯёЁ]+$/.test(trimmedValue)) {
          error = 'Только русские буквы (без дефисов)';
        }
        break;
        
      case 'username':
        if (!trimmedValue) {
          error = 'Введите логин';
        } else if (trimmedValue.length < 3) {
          error = 'Минимум 3 символа';
        } else if (trimmedValue.length > 30) {
          error = 'Максимум 30 символов';
        } else if (!/^[a-zA-Z0-9_\-]+$/.test(trimmedValue)) {
          error = 'Только латинские буквы, цифры, _ и -';
        }
        break;
        
      case 'email':
        if (!trimmedValue) {
          error = 'Введите email';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedValue)) {
            error = 'Некорректный формат email';
          }
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Введите пароль';
        } else if (value.length < 6) {
          error = 'Минимум 6 символов';
        } else if (value.length > 50) {
          error = 'Максимум 50 символов';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Пароль должен содержать заглавные, строчные буквы и цифры';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    const fieldError = validateField(name, value);
    
    setValidationErrors({
      ...validationErrors,
      [name]: fieldError
    });
    
    if (error) setError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    
    setValidationErrors({
      ...validationErrors,
      [name]: fieldError
    });
  };

  const validateForm = () => {
    const errors = {
      surname: validateField('surname', formData.surname),
      name: validateField('name', formData.name),
      patronymic: validateField('patronymic', formData.patronymic),
      username: validateField('username', formData.username),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password)
    };
    
    setValidationErrors(errors);
    
    const hasErrors = Object.values(errors).some(err => err !== '');
    
    if (hasErrors) {
      const firstErrorField = Object.keys(errors).find(key => errors[key] !== '');
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      setError('Пожалуйста, исправьте ошибки в форме');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await addUser({
        surname: formData.surname.trim(),
        name: formData.name.trim(),
        patronymic: formData.patronymic.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role_id: parseInt(formData.role_id)
      }).unwrap();
      
      if (response.success) {
        toast.success(`Пользователь ${formData.surname} ${formData.name} ${formData.patronymic} успешно добавлен!`);
        
        setFormData({
          surname: '',
          name: '',
          patronymic: '',
          username: '',
          email: '',
          password: '',
          role_id: '2'
        });
        
        setValidationErrors({
          surname: '',
          name: '',
          patronymic: '',
          username: '',
          email: '',
          password: ''
        });
        
        setError('');
      }
    } catch (err) {
      console.error('Error adding user:', err);
      
      let errorMessage = 'Не удалось создать пользователя';
      
      if (err.data) {
        if (typeof err.data === 'string') {
          if (err.data.toLowerCase().includes('username') || err.data.toLowerCase().includes('логин')) {
            errorMessage = 'Пользователь с таким логином уже существует';
          } else if (err.data.toLowerCase().includes('email') || err.data.toLowerCase().includes('почта')) {
            errorMessage = 'Пользователь с таким email уже существует';
          } else {
            errorMessage = err.data;
          }
        } else if (err.data.error) {
          errorMessage = err.data.error;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        }
      } else if (err.status === 400) {
        errorMessage = 'Некорректные данные пользователя';
      } else if (err.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setFormData({
      surname: '',
      name: '',
      patronymic: '',
      username: '',
      email: '',
      password: '',
      role_id: '2'
    });
    setValidationErrors({
      surname: '',
      name: '',
      patronymic: '',
      username: '',
      email: '',
      password: ''
    });
    setError('');
  };

  return (
    <Card className="h-100">
      <CardHeader className="common-header bg-white">
        <h5 className="mb-0">Добавление нового пользователя</h5>
      </CardHeader>
      <CardBody>
        {error && (
          <Alert color="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} noValidate>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="surname">
                  Фамилия <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="surname"
                  id="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Иванов"
                  disabled={isLoading}
                  required
                  invalid={!!validationErrors.surname}
                />
                {validationErrors.surname && (
                  <FormText color="danger">{validationErrors.surname}</FormText>
                )}
                {!validationErrors.surname && formData.surname && (
                  <FormText color="success">✓ Корректно</FormText>
                )}
              </FormGroup>
            </Col>
            
            <Col md={4}>
              <FormGroup>
                <Label for="name">
                  Имя <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Иван"
                  disabled={isLoading}
                  required
                  invalid={!!validationErrors.name}
                />
                {validationErrors.name && (
                  <FormText color="danger">{validationErrors.name}</FormText>
                )}
                {!validationErrors.name && formData.name && (
                  <FormText color="success">✓ Корректно</FormText>
                )}
              </FormGroup>
            </Col>
            
            <Col md={4}>
              <FormGroup>
                <Label for="patronymic">
                  Отчество <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="patronymic"
                  id="patronymic"
                  value={formData.patronymic}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Иванович"
                  disabled={isLoading}
                  required
                  invalid={!!validationErrors.patronymic}
                />
                {validationErrors.patronymic && (
                  <FormText color="danger">{validationErrors.patronymic}</FormText>
                )}
                {!validationErrors.patronymic && formData.patronymic && (
                  <FormText color="success">✓ Корректно</FormText>
                )}
              </FormGroup>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="username">
                  Логин <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="ivanov_i"
                  disabled={isLoading}
                  required
                  invalid={!!validationErrors.username}
                />
                {validationErrors.username && (
                  <FormText color="danger">{validationErrors.username}</FormText>
                )}
                {!validationErrors.username && formData.username && (
                  <FormText color="success">✓ Доступен</FormText>
                )}
              </FormGroup>
            </Col>
            
            <Col md={6}>
              <FormGroup>
                <Label for="email">
                  Email <span className="text-danger">*</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="example@domain.com"
                  disabled={isLoading}
                  required
                  invalid={!!validationErrors.email}
                />
                {validationErrors.email && (
                  <FormText color="danger">{validationErrors.email}</FormText>
                )}
                {!validationErrors.email && formData.email && (
                  <FormText color="success">✓ Корректный</FormText>
                )}
              </FormGroup>
            </Col>
          </Row>
          
          <Row>
            <Col md={8}>
              <FormGroup>
                <Label for="password">
                  Пароль <span className="text-danger">*</span>
                </Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Минимум 6 символов"
                  disabled={isLoading}
                  required
                  invalid={!!validationErrors.password}
                />
                {validationErrors.password && (
                  <FormText color="danger">{validationErrors.password}</FormText>
                )}
                {!validationErrors.password && formData.password && (
                  <FormText color="success">✓ Надёжный пароль</FormText>
                )}
                <FormText color="muted" className="mt-1">
                  Должен содержать заглавные, строчные буквы и цифры
                </FormText>
              </FormGroup>
            </Col>
            
            <Col md={4}>
              <FormGroup>
                <Label for="role_id">
                  Роль <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  name="role_id"
                  id="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.description}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          
          <div className="alert alert-info mt-3">
            <small>
              <strong>Примечание:</strong> Все поля обязательны.
              <br />
              • Фамилия и имя: только русские буквы и дефис (не в начале/конце).
              <br />
              • Отчество: только русские буквы.
              <br />
              • Логин: латинские буквы, цифры, _ и - (уникальный).
              <br />
              • Email: должен быть уникальным.
            </small>
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              color="secondary" 
              onClick={handleReset}
              disabled={isLoading}
              outline
            >
              Очистить форму
            </Button>
            
            <Button 
              color="primary" 
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Добавление...
                </>
              ) : (
                'Добавить пользователя'
              )}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
};

export default AddUser;