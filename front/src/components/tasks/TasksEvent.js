import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TaskList from './TaskList';
import '../../css/Task.css';
import AddTask from './AddTask';

const TasksEvent = () => {
  const [editingTask, setEditingTask] = useState(null);
  const [refreshList, setRefreshList] = useState(false);

  const handleEditTask = (task) => {
    // Преобразование данных задачи для формы
    const taskData = {
      ...task,
      start_date: new Date(task.start_date),
      due_date: new Date(task.due_date),
      startTime: new Date(task.start_date),
      dueTime: new Date(task.due_date),
      location: task.location || null
    };
    setEditingTask(taskData);
    
    // Прокрутка к форме
    document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleTaskCreated = () => {
    setRefreshList(!refreshList); // Триггер для обновления списка
    setEditingTask(null); // Сброс формы редактирования
  };



  return (
    <Container fluid className="py-4">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <Row>
         <Col lg={5}>
          <Card className="mb-4 shadow-sm sticky-top" style={{ top: '20px' }} id="task-form">
            <CardBody>
              {editingTask ? (
                <>
                  <AddTask
                    initialData={editingTask}
                    onTaskCreated={handleTaskCreated}
                  />
                
                </>
              ) : (
                <AddTask onTaskCreated={handleTaskCreated} />
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={7}>
          <Card className="mb-4 shadow-sm">
            <CardBody>
              <TaskList 
                onEditTask={handleEditTask}
                key={refreshList ? 'refreshed' : 'normal'} // Принудительное обновление
              />
            </CardBody>
          </Card>
        </Col>
        
       
      </Row>
    </Container>
  );
};

export default TasksEvent;