import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import AddUser from './AddUser';
import UsersList from './UsersList';

const UsersEvent = () => {
  return (
    <Container fluid className="py-4">
      
      <Row>
        {/* Левая колонка - Форма добавления пользователя */}
        <Col lg={5} className="mb-4 mb-lg-0">
          <AddUser />
        </Col>
        
        {/* Правая колонка - Список пользователей */}
        <Col lg={7}>
          <UsersList />
        </Col>
      </Row>
    </Container>
  );
};

export default UsersEvent;