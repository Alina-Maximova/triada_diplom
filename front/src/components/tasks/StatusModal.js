// src/components/task/StatusModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge } from 'reactstrap';
import { getStatusColor, getStatusText, getStatusDescription } from '../../utils/utils';

const StatusModal = ({ isOpen, toggle, task, newStatus, onConfirm }) => {
  if (!task) return null;
  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Подтверждение изменения статуса</ModalHeader>
      <ModalBody>
        <p className="mb-3">Вы уверены, что хотите изменить статус задачи "<strong>{task.title || 'Без названия'}</strong>"?</p>
        <div className="alert alert-info">
          <div className="d-flex align-items-center">
            <Badge color={getStatusColor(task.status)}>{getStatusText(task.status)}</Badge>
            <i className="bi bi-arrow-right mx-3"></i>
            <Badge color={getStatusColor(newStatus)}>{getStatusText(newStatus)}</Badge>
          </div>
          <p className="mb-0 mt-2"><strong>Что произойдет:</strong> {getStatusDescription(newStatus)}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>Отмена</Button>
        <Button color="primary" onClick={onConfirm} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}>Подтвердить изменение</Button>
      </ModalFooter>
    </Modal>
  );
};

export default StatusModal;