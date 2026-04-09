import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import Login from '../components/users/Login';
import '../css/Home.css';
import logo from "../img/logo.png";

const PageLogin = () => {
  return (
      <div className="home-background">
        <Container>
          <Row className="min-vh-100 align-items-center">
            {/* Левая колонка - Приветствие и логотип */}
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="welcome-content">
                {/* Логотип */}
                <div className="logo-container mb-4">
                  <img 
                    src={logo} 
                    alt="Логотип компании" 
                    className="home-logo"
                  />
                </div>
                
                {/* Приветствие */}
                <h1 className="welcome-title mb-3">
                  Добро пожаловать в <span className="text-orange">администрорование</span>
                </h1>
                
                
              </div>
            </Col>
            
            {/* Правая колонка - Форма авторизации */}
            <Col lg={6}>
              <div className="login-wrapper">
                <Login />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
  );
};

export default PageLogin;