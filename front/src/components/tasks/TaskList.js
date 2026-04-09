// src/components/task/TaskList.js
import React, { useState } from 'react';
import {
  Card, CardBody, Alert, Input, InputGroup, InputGroupText, Button, Spinner
} from 'reactstrap';
import {
  useGetTasksQuery,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useGetMaterialsQuery,
  useAddMaterialToTaskMutation,
  useUpdateTaskMaterialQuantityMutation,
  useDownloadMaterialsMutation,
  useDownloadFileMutation,
  useUploadFileMutation,
} from '../../redux/apiSlice';
import { toast } from 'react-toastify';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';

import TaskCard from './TaskCard';
import TaskComments from './TaskComments';
import TaskFilesModal from '../files/TaskFilesModal';
import AddFileModal from '../files/AddFileModal';
import MaterialsModal from '../materials/MaterialsModal';
import AddMaterialModal from '../materials/AddMaterialModel';
import EditMaterialModal from '../materials/EditMaterialModal';
import StatusModal from './StatusModal';
import DeleteModal from './DeleteModal';
import InvoiceModal from './InvoiceModal';

const TaskList = ({ onEditTask }) => {
  const { data: tasks = [], isLoading, refetch } = useGetTasksQuery();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const { data: availableMaterials = [] } = useGetMaterialsQuery();
  const [addMaterialToTask] = useAddMaterialToTaskMutation();
  const [updateMaterialQuantity] = useUpdateTaskMaterialQuantityMutation();
  const [downloadMaterials] = useDownloadMaterialsMutation();
  const [downloadFile] = useDownloadFileMutation();
  const [uploadFile] = useUploadFileMutation();

  const [materialsModal, setMaterialsModal] = useState(false);
  const [selectedTaskForMaterials, setSelectedTaskForMaterials] = useState(null);
  const [addMaterialModal, setAddMaterialModal] = useState(false);
  const [editMaterialModal, setEditMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [fileModal, setFileModal] = useState(false);
  const [selectedTaskForFiles, setSelectedTaskForFiles] = useState(null);
  const [addFileModal, setAddFileModal] = useState(false);
  const [commentsModal, setCommentsModal] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingFile, setDownloadingFile] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const filteredTasks = tasks.filter(task => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (task.title?.toLowerCase().includes(searchLower)) ||
      (task.customer?.toLowerCase().includes(searchLower)) ||
      (task.phone?.includes(searchTerm)) ||
      (task.address?.toLowerCase().includes(searchLower));
  });

  // Статусные функции (можно импортировать из utils, но оставим локально для простоты)
  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Новая';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Выполнена';
      case 'report_added': return 'Отчет добавлен';
      case 'accepted_by_customer': return 'Принято клиентом';
      case 'rejected': return 'Отклонено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const confirmStatusChange = (task, newStatus) => {
    setSelectedTask(task);
    setSelectedNewStatus(newStatus);
    setStatusModal(true);
  };

  const handleStatusChange = async () => {
    if (!selectedTask || !selectedNewStatus) return;
    try {
      await updateTaskStatus({ id: selectedTask.id, status: selectedNewStatus }).unwrap();
      toast.success(`Статус изменен на "${getStatusText(selectedNewStatus)}"`);
      setStatusModal(false);
      setSelectedTask(null);
      setSelectedNewStatus(null);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Не удалось изменить статус');
      setStatusModal(false);
    }
  };

  const confirmDelete = (task) => {
    setSelectedTask(task);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    try {
      await deleteTask(selectedTask.id).unwrap();
      toast.success('Задача удалена');
      setDeleteModal(false);
      setSelectedTask(null);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Не удалось удалить задачу');
    }
  };

  const openMaterialsModal = (task) => {
    setSelectedTaskForMaterials(task);
    setMaterialsModal(true);
  };

  const closeMaterialsModal = () => {
    setMaterialsModal(false);
    setSelectedTaskForMaterials(null);
  };

  const openAddMaterialModal = () => setAddMaterialModal(true);
  const closeAddMaterialModal = () => setAddMaterialModal(false);

  const handleAddMaterial = async (materialData) => {
    try {
      await addMaterialToTask(materialData).unwrap();
      toast.success('Материал добавлен');
      closeAddMaterialModal();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Не удалось добавить материал');
    }
  };

  const openEditMaterialModal = (material) => {
    setSelectedMaterial(material);
    setEditMaterialModal(true);
  };

  const handleUpdateMaterial = async (id, quantity, note) => {
    try {
      await updateMaterialQuantity({ taskMaterialId: id, quantity, note }).unwrap();
      toast.success('Количество обновлено');
      setEditMaterialModal(false);
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Ошибка');
    }
  };

  const handleExportMaterials = async (taskId) => {
    try {
      const response = await downloadMaterials({ taskId }).unwrap();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `материалы_задачи_${taskId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Экспорт материалов выполнен');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось экспортировать материалы');
    }
  };

  const openFileModal = (task) => {
    setSelectedTaskForFiles(task);
    setFileModal(true);
  };

  const openAddFileModal = () => setAddFileModal(true);

  const openCommentsModal = (task) => {
    setSelectedTaskForComments(task);
    setCommentsModal(true);
  };

  const openInvoiceModal = (task) => {
    setSelectedTask(task);
    setInvoiceModal(true);
  };

  const handleUploadInvoice = async (formData) => {
    await uploadFile(formData).unwrap();
    toast.success('Накладная успешно добавлена');
    refetch();
  };

  const handleDownloadInvoice = async (taskId, filename, taskTitle) => {
    try {
      setDownloadingFile(taskId);
      const response = await downloadFile({ entity_type: 'invoice', filename }).unwrap();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Накладная скачивается...');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось скачать накладную');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteInvoice = async (taskId, taskTitle) => {
    if (!window.confirm(`Удалить накладную для задачи "${taskTitle}"?`)) return;
    try {
      // await deleteInvoice(taskId).unwrap();
      toast.success('Накладная удалена');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Не удалось удалить накладную');
    }
  };

  return (
    <>
      <div className="task-list-header mb-3">
        <h4>Список задач</h4>
        <div className="d-flex align-items-center gap-3">
          <div className="flex-grow-1">
            <InputGroup>
              <InputGroupText className="bg-white"><SearchIcon fontSize="small" /></InputGroupText>
              <Input type="text" placeholder="Поиск..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
            </InputGroup>
          </div>
          <div className="d-flex gap-2">
            {searchTerm && <Button color="outline-secondary" size="sm" onClick={() => setSearchTerm('')}><CloseIcon fontSize="small" /> Очистить</Button>}
            <Button color="primary" size="sm" onClick={refetch} disabled={isLoading} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}>
              <RefreshIcon fontSize="small" /> Обновить
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4"><Spinner color="primary" /><p>Загрузка...</p></div>
      ) : filteredTasks.length === 0 ? (
        <Alert color="info"><InfoIcon fontSize="small" /> {searchTerm ? 'Задачи не найдены' : 'Задачи отсутствуют'}</Alert>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => {
            const hasInvoice = task.has_invoice || !!task.invoice;
            const invoiceFilename = task.invoice?.filename || task.invoice_filename || 'накладная';
            return (
              <TaskCard
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onStatusChange={confirmStatusChange}
                onDeleteTask={confirmDelete}
                onOpenMaterials={openMaterialsModal}
                onOpenFiles={openFileModal}
                onOpenComments={openCommentsModal}
                onOpenInvoiceModal={openInvoiceModal}
                onDownloadInvoice={handleDownloadInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                hasInvoice={hasInvoice}
                invoiceFilename={invoiceFilename}
                canEdit={task.status === 'new' || task.status === 'in_progress'}
                canDelete={task.status === 'new' || task.status === 'in_progress'}
                canAddMaterial={task.status === 'in_progress'}
                canViewMaterials={task.status !== 'new'}
                canAddInvoice={task.status === 'accepted_by_customer' && !hasInvoice}
                downloadingFile={downloadingFile}
              />
            );
          })}
        </div>
      )}

      {/* Модальные окна */}
      <TaskComments
        isOpen={commentsModal}
        toggle={() => setCommentsModal(false)}
        taskId={selectedTaskForComments?.id}
        taskTitle={selectedTaskForComments?.title}
      />

      <TaskFilesModal
        isOpen={fileModal}
        toggle={() => setFileModal(false)}
        taskId={selectedTaskForFiles?.id}
        taskTitle={selectedTaskForFiles?.title}
        apiUrl={API_URL}
      />

      <AddFileModal
        isOpen={addFileModal}
        toggle={() => setAddFileModal(false)}
        task={selectedTaskForFiles}
        onSuccess={() => {}}
      />

      <MaterialsModal
        isOpen={materialsModal}
        toggle={closeMaterialsModal}
        task={selectedTaskForMaterials}
        onAddMaterial={openAddMaterialModal}
        onEditMaterial={openEditMaterialModal}
        onExportMaterials={handleExportMaterials}
      />

      <AddMaterialModal
        isOpen={addMaterialModal}
        toggle={closeAddMaterialModal}
        taskId={selectedTaskForMaterials?.id}
        onAddMaterial={handleAddMaterial}
        availableMaterials={availableMaterials}
      />

      <EditMaterialModal
        isOpen={editMaterialModal}
        toggle={() => setEditMaterialModal(false)}
        material={selectedMaterial}
        onUpdate={handleUpdateMaterial}
      />

      <StatusModal
        isOpen={statusModal}
        toggle={() => setStatusModal(false)}
        task={selectedTask}
        newStatus={selectedNewStatus}
        onConfirm={handleStatusChange}
      />

      <DeleteModal
        isOpen={deleteModal}
        toggle={() => setDeleteModal(false)}
        task={selectedTask}
        onConfirm={handleDelete}
      />

      <InvoiceModal
        isOpen={invoiceModal}
        toggle={() => setInvoiceModal(false)}
        task={selectedTask}
        onUploadInvoice={handleUploadInvoice}
      />
    </>
  );
};

export default TaskList;