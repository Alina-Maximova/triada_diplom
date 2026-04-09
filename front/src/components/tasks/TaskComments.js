import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormGroup,
  Spinner,
  Alert,
  ListGroup,
  ListGroupItem,
  Badge
} from 'reactstrap';
import {
  useGetTaskCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUploadFileMutation,
  useGetEntityFilesQuery,
  useDeleteFileMutation
} from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';

// Компонент для отображения файлов комментария (с миниатюрами для изображений)
const CommentFiles = ({ commentId }) => {
  const { data: files = [], isLoading, refetch } = useGetEntityFilesQuery(
    { entity_type: 'comment', entity_id: commentId },
    { skip: !commentId }
  );
  const [deleteFile] = useDeleteFileMutation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Удалить этот файл?')) return;
    try {
      await deleteFile(fileId).unwrap();
      toast.success('Файл удален');
      refetch();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Не удалось удалить файл');
    }
  };

  if (isLoading) return <Spinner size="sm" className="mt-2" />;
  if (!files || files.length === 0) return null;

  return (
    <div className="mt-2" style={{ marginLeft: '42px' }}>
      <div className="d-flex align-items-center mb-1">
        <AttachFileIcon fontSize="small" style={{ color: '#6c757d', marginRight: '4px' }} />
        <strong className="small">Прикрепленные файлы:</strong>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {files.map((file) => {
          const isImage = file.mimetype?.startsWith('image/');
          return (
            <div key={file.id} className="position-relative">
              {isImage ? (
                <a href={`${API_URL}/files/comment/${file.filename}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`${API_URL}/files/comment/${file.filename}`}
                    alt={file.originalname}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }}
                    loading="lazy"
                  />
                </a>
              ) : (
                <Badge color="light" className="p-2 d-flex align-items-center" style={{ gap: '4px' }}>
                  {file.mimetype === 'application/pdf' ? <PictureAsPdfIcon fontSize="small" /> : <InsertDriveFileIcon fontSize="small" />}
                  <a
                    href={`${API_URL}/files/comment/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: '#212529' }}
                  >
                    {file.originalname.length > 20 ? file.originalname.substring(0, 17) + '...' : file.originalname}
                  </a>
                  <small className="text-muted ms-1">({(file.size / 1024).toFixed(1)} KB)</small>
                </Badge>
              )}
              {file.uploaded_by === user.id && (
                <DeleteIcon
                  fontSize="small"
                  style={{
                    cursor: 'pointer',
                    color: '#dc3545',
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    padding: '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onClick={() => handleDeleteFile(file.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskComments = ({ isOpen, toggle, taskId, taskTitle }) => {
  const { data: comments = [], isLoading, refetch } = useGetTaskCommentsQuery(taskId, { skip: !taskId });
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadFile] = useUploadFileMutation();

  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const commentsEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} ${getMinutesWord(diffMins)} назад`;
    if (diffHours < 24) return `${diffHours} ${getHoursWord(diffHours)} назад`;
    if (diffDays < 7) return `${diffDays} ${getDaysWord(diffDays)} назад`;
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getMinutesWord = (minutes) => {
    if (minutes >= 11 && minutes <= 14) return 'минут';
    const lastDigit = minutes % 10;
    if (lastDigit === 1) return 'минуту';
    if (lastDigit >= 2 && lastDigit <= 4) return 'минуты';
    return 'минут';
  };

  const getHoursWord = (hours) => {
    if (hours >= 11 && hours <= 14) return 'часов';
    const lastDigit = hours % 10;
    if (lastDigit === 1) return 'час';
    if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
    return 'часов';
  };

  const getDaysWord = (days) => {
    if (days >= 11 && days <= 14) return 'дней';
    const lastDigit = days % 10;
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSelectedFiles = async ({comment, commentId}) => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', 'comment');
        formData.append('entity_id', commentId);
        formData.append('task_id', taskId);

        formData.append('description', `Вложение к комментарию '${comment}'`);
        return uploadFile(formData).unwrap();
      });
      await Promise.all(uploadPromises);
      toast.success(`Загружено ${selectedFiles.length} файлов`);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      toast.error('Не удалось загрузить некоторые файлы');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && selectedFiles.length === 0) {
      toast.error('Введите текст комментария или выберите файлы');
      return;
    }

    let createdCommentId = null;

    try {
      setIsSubmitting(true);
      const commentResult = await addComment({
        task_id: taskId,
        content: newComment.trim() || '(вложения)'
      }).unwrap();

      createdCommentId = commentResult.id || commentResult;

      if (selectedFiles.length > 0) {
        await uploadSelectedFiles({comment:newComment.trim(), commentId:createdCommentId});
      }

      toast.success('Комментарий добавлен');
      setNewComment('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      refetch();
    } catch (error) {
      console.error('Error adding comment or files:', error);

      if (createdCommentId) {
        try {
          await deleteComment(createdCommentId).unwrap();
          console.log('Комментарий удалён из-за ошибки загрузки файлов');
        } catch (deleteError) {
          console.error('Не удалось удалить комментарий после ошибки:', deleteError);
        }
      }

      toast.error(error.data?.error || 'Не удалось добавить комментарий');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
    try {
      setDeletingId(commentId);
      await deleteComment(commentId).unwrap();
      toast.success('Комментарий удален');
      refetch();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.data?.error || 'Не удалось удалить комментарий');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon fontSize="small" />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon fontSize="small" />;
    return <InsertDriveFileIcon fontSize="small" />;
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" style={{ maxWidth: '800px' }}>
      <ModalHeader toggle={toggle}>
        <div className="d-flex align-items-center">
          <CommentIcon style={{ marginRight: '8px', color: '#ef8810' }} />
          Комментарии к задаче: {taskTitle}
        </div>
      </ModalHeader>
      <ModalBody style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="text-center py-4"><Spinner color="primary" /><p>Загрузка...</p></div>
        ) : comments.length === 0 ? (
          <Alert color="info" className="text-center">
            <CommentIcon /> Нет комментариев. Будьте первым!
          </Alert>
        ) : (
          <ListGroup flush className="comments-list">
            {comments.map((comment) => {
              const isCurrentUser = comment.user_id === user.id;
              return (
                <ListGroupItem
                  key={comment.id}
                  className={`border-0 mb-3 ${isCurrentUser ? 'current-user' : ''}`}
                  style={{
                    backgroundColor: isCurrentUser ? '#fff8f0' : 'transparent',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: isCurrentUser ? '#ef8810' : '#6c757d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: '10px', color: 'white'
                      }}>
                        <PersonIcon fontSize="small" />
                      </div>
                      <div>
                        <strong style={{ color: isCurrentUser ? '#ef8810' : '#212529' }}>
                          {comment.user_name || 'Пользователь'}
                        </strong>
                        <div className="d-flex align-items-center mt-1">
                          <AccessTimeIcon fontSize="small" style={{ fontSize: '14px', color: '#6c757d', marginRight: '4px' }} />
                          <small className="text-muted">{formatDate(comment.created_at)}</small>
                        </div>
                      </div>
                    </div>
                    {isCurrentUser && (
                      <Button color="link" size="sm" className="p-0 text-danger"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId === comment.id}>
                        {deletingId === comment.id ? <Spinner size="sm" color="danger" /> : <DeleteIcon fontSize="small" />}
                      </Button>
                    )}
                  </div>
                  <div className="comment-content" style={{ marginLeft: '42px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {comment.content}
                  </div>
                  {/* Отображение файлов комментария с миниатюрами */}
                  <CommentFiles commentId={comment.id} />
                </ListGroupItem>
              );
            })}
            <div ref={commentsEndRef} />
          </ListGroup>
        )}
      </ModalBody>
      <ModalFooter className="border-top">
        <div style={{ width: '100%' }}>
          <FormGroup className="mb-0">
            <div className="d-flex gap-2">
              <Input
                type="textarea"
                placeholder="Введите комментарий... (Enter для отправки)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                rows="2"
                style={{ resize: 'vertical' }}
              />
              <Button
                color="primary"
                onClick={handleAddComment}
                disabled={isSubmitting || uploading || (!newComment.trim() && selectedFiles.length === 0)}
                style={{ backgroundColor: '#ef8810', borderColor: '#ef8810', minWidth: '100px', height: 'fit-content' }}
              >
                {isSubmitting || uploading ? <Spinner size="sm" /> : <><SendIcon fontSize="small" style={{ marginRight: '4px' }} /> Отправить</>}
              </Button>
            </div>
            <div className="d-flex align-items-center mt-2">
              <Button color="secondary" size="sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                <AttachFileIcon fontSize="small" style={{ marginRight: '4px' }} /> Прикрепить файлы
              </Button>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              />
              <small className="text-muted ms-2">Макс. 20MB на файл</small>
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
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default TaskComments;