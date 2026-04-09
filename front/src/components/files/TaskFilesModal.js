import React, { useState } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button, Table, Spinner, Alert
} from 'reactstrap';
import { useGetTaskFilesQuery, useDeleteFileMutation } from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import AddFileModal from './AddFileModal'; 

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return <ImageIcon fontSize="small" />;
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon fontSize="small" />;
  return <AttachFileIcon fontSize="small" />;
};

const TaskFilesModal = ({ isOpen, toggle, taskId, taskTitle, apiUrl }) => {
  const { data: taskFiles = [], isLoading, refetch } = useGetTaskFilesQuery(
    { task_id: taskId },
    { skip: !taskId }
  );
  const [deleteFile] = useDeleteFileMutation();
  const [addModalOpen, setAddModalOpen] = useState(false); // <-- State for add modal

  const handleDeleteTaskFile = async (fileId) => {
    if (!window.confirm('Удалить этот файл?')) return;
    try {
      await deleteFile(fileId).unwrap();
      toast.success('Файл удален');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить файл');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle} size="lg">
        <ModalHeader toggle={toggle}>Файлы задачи: {taskTitle}</ModalHeader>
        <ModalBody>
          {/* Toolbar with add button */}
          <div className="d-flex justify-content-end mb-2">
            <Button color="primary" size="sm"  style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }} onClick={() => setAddModalOpen(true)}>
             <AddCircleIcon fontSize="small" style={{ marginRight: '4px' }} />  Добавить файлы
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-4"><Spinner color="primary" /><p>Загрузка...</p></div>
          ) : taskFiles.length === 0 ? (
            <Alert color="info">Нет прикрепленных файлов</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th><th>Файл</th><th>Тип</th><th>Размер</th><th>Описание</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {taskFiles.map((file, idx) => {
                  const isImage = file.mimetype?.startsWith('image/');
                  return (
                    <tr key={file.id}>
                      <td>{idx + 1}</td>
                      <td>
                        {isImage ? (
                          <a href={`${apiUrl}/files/${file.entity_type}/${file.filename}`} target="_blank" rel="noopener noreferrer">
                            <img
                              src={`${apiUrl}/files/${file.entity_type}/${file.filename}`}
                              alt={file.originalname}
                              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }}
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <a href={`${apiUrl}/files/${file.entity_type}/${file.filename}`} target="_blank" rel="noopener noreferrer">
                            {getFileIcon(file.mimetype)} {file.originalname}
                          </a>
                        )}
                      </td>
                      <td>{file.mimetype}</td>
                      <td>{(file.size / 1024).toFixed(1)} KB</td>
                      <td>{file.description || ''}</td>
                      <td>
                        <Button color="danger" size="sm" outline onClick={() => handleDeleteTaskFile(file.id)}>
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle}>Закрыть</Button>
        </ModalFooter>
      </Modal>

      {/* Add File Modal */}
      <AddFileModal
        isOpen={addModalOpen}
        toggle={() => setAddModalOpen(false)}
        task={{ id: taskId }}          // Pass task id (object expected by AddFileModal)
        onSuccess={() => refetch()}    // Refresh file list after upload
      />
    </>
  );
};

export default TaskFilesModal;