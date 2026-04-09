// src/components/files/AddFileModal.js
import React, { useState, useRef } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button,
  FormGroup, Label, Input, Badge, Spinner
} from 'reactstrap';
import { useUploadMultipleFilesMutation } from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import {
  compressImage,
  checkVideoDuration,
  deduplicateFiles
} from '../../utils/mediaHelpers';

const AddFileModal = ({ isOpen, toggle, task, onSuccess }) => {
  const [uploadMultipleFiles] = useUploadMultipleFilesMutation();
  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    // Дедупликация
    const uniqueFiles = deduplicateFiles(files, selectedFiles);
    if (uniqueFiles.length === 0) {
      toast.info('Все выбранные файлы уже добавлены');
      return;
    }

    // Сжатие изображений и проверка видео
    const processed = [];
    for (const file of uniqueFiles) {
      let processedFile = file;
      try {
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file, 0.8);
        } else if (file.type.startsWith('video/')) {
          const isValid = await checkVideoDuration(file, 60);
          if (!isValid) {
            toast.warning(`Видео "${file.name}" длиннее 60 секунд и не будет загружено`);
            continue;
          }
        }
        processed.push(processedFile);
      } catch (err) {
        console.error('Ошибка обработки файла:', err);
        toast.error(`Ошибка обработки файла "${file.name}"`);
      }
    }

    if (processed.length > 0) {
      setSelectedFiles(prev => [...prev, ...processed]);
      toast.success(`Добавлено ${processed.length} файлов (изображения сжаты)`);
    }
    // Сбросить input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <ImageIcon fontSize="small" />;
    if (file.type === 'application/pdf') return <PictureAsPdfIcon fontSize="small" />;
    return <AttachFileIcon fontSize="small" />;
  };

  const handleUpload = async () => {
    if (!task || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('entity_type', 'info');
      formData.append('entity_id', String(task.id));
      formData.append('task_id', String(task.id));
      const descriptions = selectedFiles.map(() => fileDescription.trim() || null);
      formData.append('descriptions', JSON.stringify(descriptions));

      await uploadMultipleFiles(formData).unwrap();
      toast.success(`Загружено ${selectedFiles.length} файлов`);
      setSelectedFiles([]);
      setFileDescription('');
      if (onSuccess) onSuccess();
      toggle();
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      toast.error(error.data?.error || 'Не удалось загрузить файлы');
    } finally {
      setUploading(false);
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
            <Button
              color="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <AttachFileIcon fontSize="small" style={{ marginRight: '4px' }} /> Выбрать файлы
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-2 p-2 border rounded">
              <strong>Выбрано файлов: {selectedFiles.length}</strong>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {selectedFiles.map((file, idx) => (
                  <Badge key={idx} className="p-2 d-flex align-items-center">
                    {getFileIcon(file)} {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    <CloseIcon
                      fontSize="small"
                      style={{ marginLeft: '4px', cursor: 'pointer' }}
                      onClick={() => removeSelectedFile(idx)}
                    />
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