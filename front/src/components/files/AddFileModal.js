import React, { useState, useRef } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, Badge, Spinner
} from 'reactstrap';
import { useUploadFileMutation } from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';

const AddFileModal = ({ isOpen, toggle, task, onSuccess }) => {
  const [uploadFile] = useUploadFileMutation();
  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon fontSize="small" />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon fontSize="small" />;
    return <AttachFileIcon fontSize="small" />;
  };

  const handleUpload = async () => {
    if (!task || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', 'info');
        formData.append('entity_id', task.id);
        formData.append('task_id', task.id);
        formData.append('description', fileDescription.trim() || null);
        return uploadFile(formData).unwrap();
      });
      await Promise.all(uploadPromises);
      toast.success(`Загружено ${selectedFiles.length} файлов`);
      setSelectedFiles([]);
      setFileDescription('');
      if (onSuccess) onSuccess();
      toggle();
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      toast.error('Не удалось загрузить файлы');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="md">
      <ModalHeader toggle={toggle}>Добавить файлы к задаче</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="fileDescription">Описание (необязательно)</Label>
          <Input
            type="text"
            id="fileDescription"
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            placeholder="Введите описание файлов"
          />
        </FormGroup>
        <FormGroup>
          <Label>Файлы</Label>
          <div>
            <Button color="secondary" size="sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              <AttachFileIcon fontSize="small" style={{ marginRight: '4px' }} /> Выбрать файлы
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-2 p-2 border rounded">
              <strong>Выбрано файлов: {selectedFiles.length}</strong>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {selectedFiles.map((file, idx) => (
                  <Badge key={idx}  className="p-2 d-flex align-items-center">
                    {getFileIcon(file.type)} {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    <CloseIcon fontSize="small" style={{ marginLeft: '4px', cursor: 'pointer' }} onClick={() => removeSelectedFile(idx)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle} disabled={uploading}>Отмена</Button>
        <Button
          color="primary"
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
        >
          {uploading ? <Spinner size="sm" /> : 'Загрузить'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddFileModal;