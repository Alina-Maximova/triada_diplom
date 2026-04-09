import React from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import Login from '../components/users/Login';
import '../css/Home.css';
import logo from "../img/logo.png";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/'); // перенаправление на ту же страницу (или можно оставить без редиректа)
  };

  return (
    <div className="home-background">
      <Container>
        <Row className="min-vh-100 align-items-center">
          {/* Левая колонка - Приветствие и логотип */}
          <Col lg={6} className="mb-5 mb-lg-0">
            <div className="welcome-content">
              <div className="logo-container mb-4">
                <img
                  src={logo}
                  alt="Логотип компании"
                  className="home-logo"
                />
              </div>
              <h1 className="welcome-title mb-3">
                Добро пожаловать в <span className="text-orange">администрорование</span>
              </h1>
            </div>
          </Col>

          {/* Правая колонка - Форма авторизации / Сообщение о недостатке прав */}
          <Col lg={6}>
           <div className="login-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <h4 className="mb-0">У вас не хватает прав доступа</h4>
  <Button size="lg" style={{ backgroundColor: '#d9760d' }} onClick={handleLogout}>
    Выйти
  </Button>
</div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;