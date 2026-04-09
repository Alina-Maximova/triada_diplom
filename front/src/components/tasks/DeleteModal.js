// src/components/task/DeleteModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';

const DeleteModal = ({ isOpen, toggle, task, onConfirm }) => {
  if (!task) return null;
  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Подтверждение удаления</ModalHeader>
      <ModalBody>
        <p className="mb-2"><WarningIcon color="warning" style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Вы уверены, что хотите удалить задачу "<strong>{task.title || 'Без названия'}</strong>"?</p>
        <p className="text-muted small mb-0">Это действие нельзя отменить. Будут удалены все связанные данные.</p>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>Отмена</Button>
        <Button color="danger" onClick={onConfirm}><DeleteIcon fontSize="small" style={{ marginRight: '4px' }} /> Удалить</Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteModal;