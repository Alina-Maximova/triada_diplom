import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGetUsersQuery, useDeleteUserMutation } from '../../redux/apiSlice';
import {
  Container,
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Input,
  Badge,
  InputGroup,
  InputGroupText,
  Table
} from 'reactstrap';
import '../../css/UsersList.css';

const UsersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState(null);
  
  const { 
    data: users = [], 
    isLoading, 
    error: fetchError,
    refetch 
  } = useGetUsersQuery();
  
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  useEffect(() => {
    const handleUserAdded = () => {
      refetch();
    };

    window.addEventListener('userAdded', handleUserAdded);
    return () => window.removeEventListener('userAdded', handleUserAdded);
  }, [refetch]);

  const getRoleBadge = (roleId) => {
    switch(roleId) {
      case 1:
        return <Badge color="danger" className="role-badge">Admin</Badge>;
      case 2:
        return <Badge color="primary" className="role-badge">User</Badge>;
      case 3:
        return <Badge color="info" className="role-badge">Employee</Badge>;
      default:
        return <Badge color="secondary" className="role-badge">Unknown</Badge>;
    }
  };

  const getRoleName = (roleId) => {
    switch(roleId) {
      case 1:
        return 'Администратор';
      case 2:
        return 'Пользователь';
      case 3:
        return 'Сотрудник';
      default:
        return 'Неизвестно';
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      (user.role_name && user.role_name.toLowerCase().includes(searchLower))
    );
  });

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id).unwrap();
      toast.success(`Пользователь ${userToDelete.full_name} ${userToDelete.username} удален`);
      setDeleteModal(false);
      setUserToDelete(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err.data?.message || 'Ошибка сервера';
      setError(`Не удалось удалить пользователя: ${errorMsg}`);
      toast.error(`${errorMsg}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container fluid className="users-container py-4">
      <Card className="mb-4">
        <CardBody className="p-3">
          <FormGroup className="mb-0">
            <div className="d-flex align-items-center gap-3">
              <div className="flex-grow-1">
                <InputGroup>
                  <InputGroupText className="bg-white">
                    <i className="bi bi-search"></i>
                  </InputGroupText>
                  <Input
                    type="text"
                    placeholder="Поиск по имени, фамилии, email или роли..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0"
                  />
                </InputGroup>
              </div>
              <div className="d-flex gap-2">
                {searchTerm && (
                  <Button 
                    color="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                    size="sm"
                  >
                    Очистить
                  </Button>
                )}
                <Button 
                  color="primary" 
                  onClick={refetch} 
                  disabled={isLoading}
                  style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
                  size="sm"
                >
                  Обновить
                </Button>
              </div>
            </div>
          </FormGroup>
        </CardBody>
      </Card>

      {error && (
        <Alert color="danger" className="mb-4" toggle={() => setError(null)}>
          {error}
        </Alert>
      )}

      {fetchError && (
        <Alert color="danger" className="mb-4">
          Ошибка загрузки пользователей: {fetchError.data?.message || 'Неизвестная ошибка'}
        </Alert>
      )}

      {isLoading ? (
        <div className="loading-container text-center py-5">
          <Spinner color="primary" />
          <p className="mt-3">Загрузка пользователей...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="no-users text-center py-5">
          <p>Пользователи не найдены</p>
          {searchTerm && (
            <>
              <p className="text-muted">Попробуйте изменить поисковый запрос</p>
              <Button color="link" onClick={() => setSearchTerm('')}>
                Очистить поиск
              </Button>
            </>
          )}
        </div>
      ) : (
        <Card className="users-card">
          <CardBody className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 users-table">
                <thead>
                  <tr>
                    <th width="60">ID</th>
                    <th>Пользователь</th>
                    <th>Роль</th>
                    <th>Дата регистрации</th>
                    <th width="100">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="user-row">
                      <td>
                        <Badge color="light" className="user-id">
                          #{user.id}
                        </Badge>
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-name">
                            <strong>{user.full_name} {user.username}</strong>
                          </div>
                          <div className="user-email text-muted">
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="role-info">
                          {getRoleBadge(user.role_id)}
                          <div className="role-name">
                            <small>{user.role_name || getRoleName(user.role_id)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="date-info">
                          <small>{formatDate(user.created_at)}</small>
                        </div>
                      </td>
                      <td>
                        <Button
                          color="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={isDeleting}
                          className="delete-btn"
                          title="Удалить пользователя"
                        >
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {filteredUsers.length > 0 && (
              <div className="users-stats px-3 py-2 border-top">
                <small className="text-muted">
                  Показано {filteredUsers.length} из {users.length} пользователей
                </small>
                <div className="role-stats">
                  <Badge color="info" className="mr-2">Админ: {users.filter(u => u.role_id === 1).length}</Badge>
                  <Badge color="primary" className="mr-2">Сотрудник: {users.filter(u => u.role_id === 2).length}</Badge>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
        <ModalHeader toggle={() => setDeleteModal(false)}>
          Подтверждение удаления
        </ModalHeader>
        <ModalBody>
          {userToDelete && (
            <>
              Вы уверены, что хотите удалить пользователя{' '}
              <strong>{userToDelete.full_name} {userToDelete.username}</strong>?
              <br />
              <div className="user-details mt-3">
                <p><strong>Email:</strong> {userToDelete.email}</p>
                <p><strong>Роль:</strong> {getRoleName(userToDelete.role_id)}</p>
                <p><strong>Дата регистрации:</strong> {formatDate(userToDelete.created_at)}</p>
              </div>
              <Alert color="warning" className="mt-3">
                Это действие нельзя отменить. Все данные пользователя будут удалены.
              </Alert>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Отмена
          </Button>
          <Button 
            color="danger" 
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default UsersList;