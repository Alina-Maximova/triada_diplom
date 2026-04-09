// src/components/Login.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../redux/apiSlice';
import { setCredentials } from '../../redux/slices/authSlice';
import { Button, Form, FormGroup, Label, Input, Alert } from 'reactstrap';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login({ username, password }).unwrap();
      console.log(response)
      setTimeout(4000000)
      
      dispatch(setCredentials({
        token: response.token
      }));
      
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      
      // Извлечение сообщения об ошибке из разных форматов ответа
      let errorMessage = 'Ошибка авторизации';
      
      if (err.data) {
        if (typeof err.data === 'string') {
          errorMessage = err.data;
        } else if (err.data.error) {
          errorMessage = err.data.error;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        }
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <Alert color="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label for="username">Логин</Label>
          <Input
            type="text"
            name="username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Введите никнейм"
            disabled={isLoading}
          />
        </FormGroup>
        <FormGroup>
          <Label for="password">Пароль</Label>
          <Input
            type="password"
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Введите пароль"
            disabled={isLoading}
          />
        </FormGroup>
        <Button
          color="primary"
          block
          type="submit"
          style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
          disabled={isLoading}
        >
          {isLoading ? 'Вход...' : 'Войти'}
        </Button>
      </Form>
    </div>
  );
};

export default Login;