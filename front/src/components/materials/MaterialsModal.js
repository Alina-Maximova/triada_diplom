// src/components/task/MaterialsModal.js
import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Table, Spinner, Alert, Badge } from 'reactstrap';
import { Info, Edit, Delete, AddCircle,  FileDownload } from '@mui/icons-material';
import { useGetTaskMaterialsQuery, useRemoveMaterialFromTaskMutation } from '../../redux/apiSlice';
import { toast } from 'react-toastify';

const MaterialsModal = ({ isOpen, toggle, task, onAddMaterial, onEditMaterial, onExportMaterials }) => {
  const { data: materials = [], isLoading, refetch } = useGetTaskMaterialsQuery(task?.id, { skip: !task });
  const [removeMaterial] = useRemoveMaterialFromTaskMutation();

  const handleRemoveMaterial = async (material) => {
    if (!window.confirm(`Удалить материал "${material.material_name || material.custom_name}"?`)) return;
    try {
      await removeMaterial(material.id).unwrap();
      toast.success('Материал удален');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.error || 'Ошибка');
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Материалы задачи: {task?.title}</ModalHeader>
      <ModalBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Список материалов</h5>
          <div>
            {(task?.status === 'report_added' || task?.status === 'accepted_by_customer' || task?.status === 'completed') && (
              <Button color="success" size="sm" onClick={() => onExportMaterials(task.id)} style={{ marginRight: '8px' }}>
                <FileDownload fontSize="small" style={{ marginRight: '4px' }} /> Экспорт в Excel
              </Button>
            )}
            {task?.status === 'in_progress' && (
              <Button color="primary" size="sm" onClick={onAddMaterial} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}>
                <AddCircle fontSize="small" style={{ marginRight: '4px' }} /> Добавить материал
              </Button>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-4"><Spinner color="primary" /><p>Загрузка...</p></div>
        ) : materials.length === 0 ? (
          <Alert color="info"><Info fontSize="small" /> Материалы отсутствуют</Alert>
        ) : (
          <Table responsive hover>
            <thead className="bg-light">
              <tr>
                <th>#</th><th>Материал</th><th>Ед. изм.</th><th>Количество</th><th>Примечание</th><th className="text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material, index) => (
                <tr key={material.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{material.material_name || material.custom_name}</strong>
                    {!material.material_id && <Badge color="warning" className="ml-1">Кастомный</Badge>}
                  </td>
                  <td>{material.material_unit || material.custom_unit}</td>
                  <td>{material.quantity}</td>
                  <td>{material.note || '—'}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button color="primary" size="sm" onClick={() => onEditMaterial(material)} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }} title="Редактировать количество">
                        <Edit fontSize="small" />
                      </Button>
                      <Button color="danger" size="sm" outline onClick={() => handleRemoveMaterial(material)} title="Удалить материал">
                        <Delete fontSize="small" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>Закрыть</Button>
      </ModalFooter>
    </Modal>
  );
};

export default MaterialsModal;