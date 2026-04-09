// src/components/task/InvoiceModal.js
import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Alert, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';

const InvoiceModal = ({ isOpen, toggle, task, onUploadInvoice }) => {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Недопустимый тип файла. Разрешены: PDF, изображения, Word, Excel');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимальный размер: 20MB');
        return;
      }
      setInvoiceFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!task || !invoiceFile) return;
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', invoiceFile);
      formData.append('entity_type', 'invoice');
      formData.append('entity_id', task.id);
      formData.append('task_id', task.id);
      formData.append('description', `Накладная к задаче '${task.title}'`);
      await onUploadInvoice(formData);
      setInvoiceFile(null);
      toggle();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Не удалось добавить накладную');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Добавление накладной</ModalHeader>
      <ModalBody>
        <div className="mb-3">
          <p><strong>Задача:</strong> {task?.title}</p>
          <p><strong>Клиент:</strong> {task?.customer}</p>
          <p className="text-muted small"><InfoIcon fontSize="small" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Накладная добавляется только к задачам со статусом "Принято клиентом"</p>
        </div>
        <Form>
          <FormGroup>
            <Label for="invoiceFile">Файл накладной *</Label>
            <Input type="file" id="invoiceFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx" required />
            <div className="mt-1"><small className="text-muted">Разрешены: PDF, изображения, Word, Excel. Макс. 20MB</small></div>
          </FormGroup>
        </Form>
        {invoiceFile && (
          <Alert color="success" className="mt-3">
            <div className="d-flex justify-content-between align-items-center">
              <div><strong>Выбран файл:</strong> {invoiceFile.name}<br /><small>Размер: {(invoiceFile.size / 1024).toFixed(2)} KB</small></div>
              <Button color="danger" size="sm" onClick={() => setInvoiceFile(null)}><DeleteIcon fontSize="small" /> Удалить</Button>
            </div>
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>Отмена</Button>
        <Button color="primary" onClick={handleSubmit} disabled={!invoiceFile || isUploading} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}>
          {isUploading ? <><Spinner size="sm" /> Загрузка...</> : 'Добавить накладную'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default InvoiceModal;