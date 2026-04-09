import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
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
  InputGroupText
} from 'reactstrap';
import { useGetReportsQuery, useDownloadReportMutation, useDeleteReportMutation } from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import '../../css/ReportsList.css';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';



const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ReportsList = () => {
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reports = [], isLoading, refetch } = useGetReportsQuery();
  const [downloadReport, { isLoading: isDownloading }] = useDownloadReportMutation();
  const [deleteReportApi] = useDeleteReportMutation();
  console.log(reports)

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const downloadReportArchive = async (reportId, taskTitle) => {
    try {
      const response = await downloadReport(reportId).unwrap();
      const blob = new Blob([response], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `отчет-${taskTitle.replace(/[^a-zа-я0-9]/gi, '_')}.zip`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка при скачивании отчета:', err);
      if (err.status === 404) {
        setError('Функция скачивания архива не настроена на сервере');
      } else {
        setError('Не удалось скачать отчет');
      }
    }
  };

  const confirmDelete = (report) => {
    setSelectedReport(report);
    setDeleteModal(true);
  };

  const deleteReport = async () => {
    if (!selectedReport) return;
    try {
      await deleteReportApi(selectedReport.id).unwrap();
      setDeleteModal(false);
      setSelectedReport(null);
      toast.success('Отчет удален');
    } catch (err) {
      console.error('Ошибка при удалении отчета:', err);
      setError('Не удалось удалить отчет');
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Фильтрация отчетов
  const filteredReports = reports.filter(report => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    console.log(report)
    return (
      (report.task_title?.toLowerCase().includes(searchLower)) ||
      (report.customer?.toLowerCase().includes(searchLower)) ||
      (report.address?.toLowerCase().includes(searchLower)) ||
      (report.phone?.includes(searchTerm))
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const map = {
      completed: 'Выполнена',
      report_added: 'Отчет добавлен',
      accepted_by_customer: 'Принято клиентом',
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      completed: 'success',
      report_added: 'info',
      accepted_by_customer: 'warning',
    };
    return map[status] || 'secondary';
  };
  console.log(reports)

  // Рендер файлов в стиле TaskComments
  const renderFiles = (files) => {
    if (!files || files.length === 0) return null;
    console.log(files)

    return (
      <div className="mt-2">
        <div className="d-flex align-items-center mb-1">
          <AttachFileIcon fontSize="small" style={{ color: '#6c757d', marginRight: '4px' }} />
          <strong className="small">Прикрепленные файлы:</strong>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {files.map((file) => {
            const isImage = file.mimetype?.startsWith('image/');
            const fileUrl = `${API_URL}/files/report/${file.filename}`;
            const isAuthor = file.uploaded_by === user.id;


            return (
              <div key={file.id} className="position-relative">
                {isImage ? (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                     <img
                    src={`${API_URL}/files/report/${file.filename}`}
                    alt={file.originalname}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }}
                    loading="lazy"
                  />
                  </a>
                ) : (
                  <Badge color="light" className="p-2 d-flex align-items-center" style={{ gap: '4px' }}>
                    {file.mimetype === 'application/pdf' ? (
                      <PictureAsPdfIcon fontSize="small" />
                    ) : (
                      <InsertDriveFileIcon fontSize="small" />
                    )}
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: '#212529' }}
                    >
                      {file.originalname.length > 20
                        ? file.originalname.substring(0, 17) + '...'
                        : file.originalname}
                    </a>
                    <small className="text-muted ms-1">({formatFileSize(file.size)})</small>
                  </Badge>
                )}
                {isAuthor && (
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
                    onClick={() => {
                      // Здесь можно вызвать API для удаления файла
                      // например, await deleteFile(file.id);
                      toast.info('Удаление файла пока не реализовано');
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container text-center py-5">
        <Spinner color="primary" />
        <p className="mt-2">Загрузка отчетов...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <Card className="search-card">
        <CardBody>
          <FormGroup>
            <div className="d-flex align-items-center gap-3">
              <div className="flex-grow-1">
                <InputGroup>
                  <InputGroupText className="bg-white">
                    <i className="bi bi-search"></i>
                  </InputGroupText>
                  <Input
                    type="text"
                    placeholder="Поиск по названию задачи, клиенту, адресу или телефону..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="border-start-0"
                  />
                </InputGroup>
              </div>
              <div className="d-flex gap-2">
                {searchTerm && (
                  <Button color="outline-secondary" size="sm" onClick={() => setSearchTerm('')}>
                    Очистить
                  </Button>
                )}
                <Button
                  color="primary"
                  size="sm"
                  onClick={refetch}
                  disabled={isLoading}
                  style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
                >
                  Обновить
                </Button>
              </div>
            </div>
          </FormGroup>
        </CardBody>
      </Card>

      {error && (
        <Alert color="danger" className="mt-3" toggle={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredReports.length === 0 ? (
        <div className="no-reports text-center py-5">
          <p>Отчеты не найдены</p>
          {searchTerm && <p className="text-muted">Попробуйте изменить поисковый запрос</p>}
        </div>
      ) : (
        <div className="reports-list">
          {filteredReports.map((report) => (
            <Card key={report.id} className="report-card mb-3">
              <div className="report-header d-flex justify-content-between align-items-start p-3">
                <div>
                  <CardTitle tag="h5" className="mb-1">
                    {report.task_title || 'Без названия'}
                  </CardTitle>
                  <Badge color="light" className="report-id">
                    #{report.id}
                  </Badge>
                </div>
                <div className="report-actions d-flex gap-2">
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => downloadReportArchive(report.id, report.task_title)}
                    disabled={isDownloading}
                    style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
                  >
                    {isDownloading ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Загрузка...
                      </>
                    ) : (
                      'Скачать архив'
                    )}
                  </Button>
                  <Button color="danger" size="sm" onClick={() => confirmDelete(report)}>
                    Удалить
                  </Button>
                </div>
              </div>

              <CardBody className="report-details pt-0">
                <div className="detail-row">
                  <strong>Клиент:</strong> <span>{report.customer || 'Не указан'}</span>
                </div>
                <div className="detail-row">
                  <strong>Адрес:</strong> <span>{report.address || 'Не указан'}</span>
                </div>
                <div className="detail-row">
                  <strong>Телефон:</strong> <span>{report.phone || 'Не указан'}</span>
                </div>
                <div className="detail-row">
                  <strong>Дата создания:</strong> <span>{formatDate(report.created_at)}</span>
                </div>
                <div className="detail-row">
                  <strong>Статус задачи:</strong>{' '}
                  <Badge color={getStatusColor(report.task_status)} pill>
                    {getStatusText(report.task_status)}
                  </Badge>
                </div>
              </CardBody>

              {report.description && (
                <CardBody className="report-description pt-0">
                  <strong>Описание отчета:</strong>
                  <p className="mb-0 text-muted">{report.description}</p>
                </CardBody>
              )}

              {/* Файлы отчета в стиле TaskComments */}
              {report.files && report.files.length > 0 && (
                <CardBody className="report-files pt-0">
                  {renderFiles(report.files)}
                </CardBody>
              )}

              <div className="report-footer text-muted small p-3 border-top">
                ID задачи: {report.task_id}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
        <ModalHeader toggle={() => setDeleteModal(false)}>
          Подтверждение удаления
        </ModalHeader>
        <ModalBody>
          Вы уверены, что хотите удалить отчет "
          <strong>{selectedReport?.task_title || 'Без названия'}</strong>"?
          <br />
          <small className="text-muted">Это действие нельзя отменить.</small>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Отмена
          </Button>
          <Button color="danger" onClick={deleteReport}>
            Удалить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ReportsList;