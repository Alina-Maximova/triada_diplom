import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, Spinner, Alert, Badge } from 'reactstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useGetTasksQuery } from '../redux/apiSlice';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import '../css/CalendarView.css';
import { getStatusColor, getStatusText } from '../utils/utils';

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: tasks = [], isLoading, error } = useGetTasksQuery();

  

  // Форматирование даты и времени
  const formatDateTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd.MM.yyyy HH:mm');
    } catch (e) {
      return '??';
    }
  };

  // Получить задачи, попадающие в выбранный день
  const getTasksForDay = (day) => {
    if (!tasks.length) return [];
    
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    return tasks.filter(task => {
      try {
        const start = parseISO(task.start_date);
        const end = parseISO(task.due_date);
        return (start <= dayEnd && end >= dayStart);
      } catch (e) {
        console.error('Error parsing date for task:', task.id, e);
        return false;
      }
    });
  };

  const tasksForSelectedDay = getTasksForDay(selectedDate);

  // Отметить дни, в которых есть задачи
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const tasksCount = getTasksForDay(date).length;
      if (tasksCount > 0) {
        return (
          <div className="task-dot-container">
            <span className="task-dot"></span>
            {tasksCount > 1 && <span className="task-count">{tasksCount}</span>}
          </div>
        );
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner color="primary" />
        <p className="mt-2">Загрузка календаря...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert color="danger">Ошибка загрузки задач</Alert>
      </Container>
    );
  }

  // Календарь показываем всегда, но если задач нет, выводим сообщение в правой панели
  const hasTasks = tasks.length > 0;

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={8}>
          <Card className="shadow-sm">
            <CardBody>
              <CardTitle tag="h4">Календарь задач</CardTitle>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                locale="ru-RU"
                tileContent={tileContent}
                className="w-100 border-0"
              />
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <CardBody>
              <CardTitle tag="h5">
                Задачи на {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
              </CardTitle>
              {!hasTasks ? (
                <Alert color="info" className="mt-3">Задачи отсутствуют. Добавьте первую задачу.</Alert>
              ) : tasksForSelectedDay.length === 0 ? (
                <Alert color="info" className="mt-3">Нет задач на этот день</Alert>
              ) : (
                <div className="task-list">
                  {tasksForSelectedDay.map(task => (
                    <Card key={task.id} className="mb-3 border-0 shadow-sm">
                      <CardBody className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{task.title}</h6>
                          <Badge color={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Badge>
                        </div>
                        
                        <p className="mb-1 small text-muted">
                          <strong>Клиент:</strong> {task.customer || 'Не указан'}
                        </p>
                        
                        {task.phone && (
                          <p className="mb-1 small text-muted">
                            <strong>Телефон:</strong> {task.phone}
                          </p>
                        )}
                        
                        {task.address && (
                          <p className="mb-1 small text-muted">
                            <strong>Адрес:</strong> {task.address}
                          </p>
                        )}
                        
                        <div className="mt-2 p-2 bg-light rounded">
                          <p className="mb-1 small">
                            <strong>Начало:</strong> {formatDateTime(task.start_date)}
                          </p>
                          <p className="mb-0 small">
                            <strong>Окончание:</strong> {formatDateTime(task.due_date)}
                          </p>
                        </div>

                        {task.description && (
                          <p className="mt-2 mb-0 small text-muted">
                            <strong>Описание:</strong> {task.description.length > 50 
                              ? `${task.description.substring(0, 50)}...` 
                              : task.description}
                          </p>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CalendarView;