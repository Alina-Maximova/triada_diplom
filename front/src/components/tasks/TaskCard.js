// components/task/TaskCard.js
import React, { useState } from 'react';
import {
  Card, CardBody, CardTitle, Badge, Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Table, Spinner
} from 'reactstrap';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ArchiveIcon from '@mui/icons-material/Archive';


import { useDownloadTaskArchiveMutation } from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import { getAvailableStatuses, getStatusColor, getStatusDescription, getStatusText } from '../../utils/utils';
import { decryptData } from '../../utils/encryption';
// Компонент для отображения материалов (мини-список)
const MaterialsList = ({ materials }) => {
  if (!materials || materials.length === 0) {
    return (
      <div className="text-muted small mt-2">
        <InventoryIcon fontSize="small" /> Нет материалов
      </div>
    );
  }
  return (
    <div className="mt-2">
      <div className="d-flex align-items-center mb-1">
        <InventoryIcon fontSize="small" style={{ color: '#ef8810' }} />
        <strong className="small ms-1">Материалы:</strong>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {materials.slice(0, 3).map((m, idx) => (
          <Badge key={idx} color="light" className="p-2" style={{ fontSize: '0.8em' }}>
            {m.material_name || m.custom_name}: {m.quantity} {m.material_unit || m.custom_unit}
          </Badge>
        ))}
        {materials.length > 3 && (
          <Badge color="light" className="p-2">+{materials.length - 3}</Badge>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({
  task,
  onEditTask,
  onStatusChange,
  onDeleteTask,
  onOpenMaterials,
  onOpenFiles,
  onOpenComments,
  onOpenInvoiceModal,
  onDownloadInvoice,
  onDeleteInvoice,
  hasInvoice,
  invoiceFilename,
  canEdit,
  canDelete,
  canAddMaterial,
  canViewMaterials,
  canAddInvoice,
  downloadingFile,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(prev => !prev);
  const [downloadTaskArchive] = useDownloadTaskArchiveMutation();

  // Определяем доступные действия для статуса

  
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const availableStatuses = getAvailableStatuses(task.status);
  const mainAction = availableStatuses.length > 0 ? availableStatuses : null;
  const handleDownloadArchive = async (taskId, taskTitle) => {
    try {
      const blob = await downloadTaskArchive(taskId).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `задача_${taskId}_${taskTitle.replace(/[^a-zа-я0-9]/gi, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Архив скачивается...');
    } catch (error) {
      console.error('Error downloading archive:', error);
      toast.error('Не удалось скачать архив');
    }
  };
  return (
    <Card className="mb-3 shadow-sm">
      <CardBody>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <CardTitle tag="h5" className="mb-1">{task.title}</CardTitle>
            <Badge color={getStatusColor(task.status)}>{getStatusText(task.status)}</Badge>
            {hasInvoice && <Badge color="success" className="ml-1"><DescriptionIcon fontSize="small" /> Накладная</Badge>}
            {task.materials_count > 0 && (
              <Badge color="info" className="ml-1">
                <InventoryIcon fontSize="small" /> {task.materials_count} {task.materials_count === 1 ? 'материал' : task.materials_count < 5 ? 'материала' : 'материалов'}
              </Badge>
            )}
          </div>

          <div className="d-flex gap-1">
            {mainAction && (mainAction.map(((status) => (
              <Button
                color={status.color}
                size="sm"
                onClick={() => onStatusChange(task, status.value)}
                title={getStatusDescription(status.value)}
              >
                {status.icon} {status.label}
              </Button>
            )))

            )}

            <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
              <DropdownToggle color="light" size="sm"><MoreVertIcon /></DropdownToggle>
              <DropdownMenu>
                {canViewMaterials && (
                  <DropdownItem onClick={() => onOpenMaterials(task)}>
                    <VisibilityIcon fontSize="small" style={{ marginRight: '8px' }} />
                    Материалы {task.materials_count > 0 ? `(${task.materials_count})` : ''}
                  </DropdownItem>
                )}
                {canAddMaterial && (
                  <DropdownItem onClick={() => onOpenMaterials(task)}>
                    <AddCircleIcon fontSize="small" style={{ marginRight: '8px', color: '#28a745' }} />
                    Добавить материал
                  </DropdownItem>
                )}
                <DropdownItem onClick={() => onOpenFiles(task)}>
                  <AttachFileIcon fontSize="small" style={{ marginRight: '8px', color: '#17a2b8' }} />
                  Файлы {task.files_count > 0 && (
                    <Badge color="info" className="ml-1">
                      <AttachFileIcon fontSize="small" style={{ marginRight: '4px' }} />
                      {task.files_count} {task.files_count === 1 ? 'файл' : task.files_count < 5 ? 'файла' : 'файлов'}
                    </Badge>
                  )}
                </DropdownItem>
                <DropdownItem onClick={() => onOpenComments(task)}>
                  <CommentIcon fontSize="small" style={{ marginRight: '8px', color: '#17a2b8' }} />
                  Комментарии {task.comments_count > 0 ? `(${task.comments_count})` : ''}
                </DropdownItem>

                {(canViewMaterials || canAddMaterial) && (canEdit || canDelete) && <DropdownItem divider />}

                {canEdit && (
                  <DropdownItem onClick={() => onEditTask(task)}>
                    <EditIcon fontSize="small" style={{ marginRight: '8px', color: '#ef8810' }} />
                    Редактировать
                  </DropdownItem>
                )}
                {canAddInvoice && (
                  <DropdownItem onClick={() => onOpenInvoiceModal(task)}>
                    <DescriptionIcon fontSize="small" style={{ marginRight: '8px', color: '#17a2b8' }} />
                    Добавить накладную
                  </DropdownItem>
                )}
                {hasInvoice && (
                  <DropdownItem onClick={() => onDownloadInvoice(task.id, invoiceFilename, task.title)}>
                    <DownloadIcon fontSize="small" style={{ marginRight: '8px', color: '#007bff' }} />
                    Скачать накладную
                  </DropdownItem>
                )}
                {canDelete && (
                  <DropdownItem onClick={() => onDeleteTask(task)} style={{ color: '#dc3545' }}>
                    <DeleteIcon fontSize="small" style={{ marginRight: '8px', color: '#dc3545' }} />
                    Удалить
                  </DropdownItem>
                )}
                <DropdownItem onClick={() => handleDownloadArchive(task.id, task.title)}>
                  <ArchiveIcon fontSize="small" style={{ marginRight: '8px' }} />
                  Скачать архив задачи
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <Table borderless size="sm">
          <tbody>
            <tr><td width="120"><strong>Клиент:</strong></td><td>{decryptData(task.customer)}</td></tr>
            <tr><td><strong>Телефон:</strong></td><td>{decryptData(task.phone)}</td></tr>
            <tr><td><strong>Адрес:</strong></td><td>{task.address || 'Не указан'}</td></tr>
            <tr><td><strong>Начало:</strong></td><td>{formatDate(task.start_date)}</td></tr>
            <tr><td><strong>Окончание:</strong></td><td>{formatDate(task.due_date)}</td></tr>
            {hasInvoice && (
              <tr>
                <td><strong>Накладная:</strong></td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Button color="link" size="sm" onClick={() => onDownloadInvoice(task.id, invoiceFilename, task.title)}
                      disabled={downloadingFile === task.id} className="p-0 d-flex align-items-center">
                      {downloadingFile === task.id ? <><Spinner size="sm" /> Скачивание...</> : <><DownloadIcon fontSize="small" /> {invoiceFilename}</>}
                    </Button>
                    <Button color="link" size="sm" onClick={() => onDeleteInvoice(task.id, task.title)} className="p-0 text-danger">
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* Отображение материалов в карточке */}
        {task.materials && task.materials.length > 0 && <MaterialsList materials={task.materials} />}

        {task.description && (
          <div className="mt-2">
            <strong>Описание:</strong>
            <p className="mb-0 text-muted small">{task.description.length > 150 ? task.description.substring(0, 150) + '...' : task.description}</p>
          </div>
        )}
        {task.addressNote && (
          <div className="mt-2">
            <strong>Примечание:</strong>
            <p className="mb-0 text-muted small">{task.addressNote}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TaskCard;