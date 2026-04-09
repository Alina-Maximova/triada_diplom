import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Button,
  Table,
  Spinner,
  Alert,
  Input,
  InputGroup,
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { 
  useGetMaterialsQuery,
  useDeleteMaterialMutation
} from '../../redux/apiSlice';
import { toast } from 'react-toastify';

const MaterialList = ({ onEditMaterial }) => {
  const { data: materials = [], isLoading, refetch } = useGetMaterialsQuery();
  const [deleteMaterial] = useDeleteMaterialMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  console.log(materials)

  const filteredMaterials = materials.filter(material => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (material.name && material.name.toLowerCase().includes(searchLower)) ||
      (material.description && material.description.toLowerCase().includes(searchLower)) ||
      (material.unit && material.unit.toLowerCase().includes(searchLower))
    );
  });

  const handleEdit = (material) => {
    if (onEditMaterial) {
      onEditMaterial(material);
    }
  };

  const handleDeleteClick = (material) => {
    setSelectedMaterial(material);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;

    try {
      await deleteMaterial(selectedMaterial.id).unwrap();
      toast.success('Материал успешно удален');
      setDeleteModal(false);
      setSelectedMaterial(null);
      refetch(); // Обновляем список
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Ошибка при удалении материала');
    }
  };

  return (
    <>
      <div className="task-list-header mb-3">
        <h4>Список материалов</h4>
        <div className="d-flex align-items-center gap-3">
          <div className="flex-grow-1">
            <InputGroup>
              <InputGroupText className="bg-white">
                <i className="bi bi-search"></i>
              </InputGroupText>
              <Input
                type="text"
                placeholder="Поиск по материалам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          <div className="d-flex gap-2">
            {searchTerm && (
              <Button 
                color="outline-secondary" 
                onClick={() => setSearchTerm('')}
                size="sm"
              >
                Очистить
              </Button>
            )}
            <Button 
              color="primary" 
              onClick={refetch} 
              disabled={isLoading}
              style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
              size="sm"
            >
              Обновить
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner color="primary" />
          <p className="mt-2">Загрузка материалов...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Alert color="info">
          {searchTerm ? 'Материалы по вашему запросу не найдены' : 'Материалы отсутствуют'}
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <CardBody className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-4">Название материала</th>
                  <th className="py-3 px-4">Единица измерения</th>
                  <th className="py-3 px-4">Описание</th>
                  <th className="py-3 px-4 text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id}>
                    <td className="py-3 px-4 fw-bold">{material.name}</td>
                    <td className="py-3 px-4">{material.unit}</td>
                    <td className="py-3 px-4">{material.description || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="d-flex flex-column gap-2 align-items-center">
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handleEdit(material)}
                          style={{ 
                            backgroundColor: '#ef8810', 
                            borderColor: '#ef8810',
                            minWidth: '120px'
                          }}
                          title="Редактировать материал"
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Редактировать
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          outline
                          onClick={() => handleDeleteClick(material)}
                          title="Удалить материал"
                          style={{ minWidth: '120px' }}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
        <ModalHeader toggle={() => setDeleteModal(false)}>
          Подтверждение удаления
        </ModalHeader>
        <ModalBody>
          <p className="mb-2">
            Вы уверены, что хотите удалить материал "
            <strong>{selectedMaterial?.name}</strong>"?
          </p>
          <p className="text-muted small mb-0">
            Это действие нельзя отменить.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Отмена
          </Button>
          <Button color="danger" onClick={handleDelete}>
            Удалить
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default MaterialList;