// src/components/task/AddMaterialModal.js
import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, Alert, InputGroup, InputGroupText } from 'reactstrap';
import { toast } from 'react-toastify';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

const CustomSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#ef8810',
    '&:hover': { backgroundColor: 'rgba(239, 136, 16, 0.08)' },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ef8810' },
}));

const AddMaterialModal = ({ isOpen, toggle, taskId, onAddMaterial, availableMaterials }) => {
  const [materialQuantity, setMaterialQuantity] = useState(1);
  const [materialNote, setMaterialNote] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [customMaterialUnit, setCustomMaterialUnit] = useState('');
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredMaterials = availableMaterials.filter(material => {
    if (!materialSearchTerm.trim()) return true;
    const searchLower = materialSearchTerm.toLowerCase();
    return material.name.toLowerCase().includes(searchLower) ||
      material.unit.toLowerCase().includes(searchLower) ||
      (material.description && material.description.toLowerCase().includes(searchLower));
  });

  const handleSelectMaterial = (materialId, materialName) => {
    setSelectedMaterialId(materialId);
    setMaterialSearchTerm(materialName);
    setShowSearchResults(false);
  };

  const handleAdd = async () => {
    if (!taskId) return;
    if (!isCustomMaterial && !selectedMaterialId) {
      toast.error('Выберите материал из справочника');
      return;
    }
    if (isCustomMaterial) {
      if (!customMaterialName) {
        toast.error('Введите название кастомного материала');
        return;
      }
      if (!customMaterialUnit) {
        toast.error('Укажите единицу измерения');
        return;
      }
    }
    if (!materialQuantity || materialQuantity <= 0) {
      toast.error('Укажите количество материала');
      return;
    }
    const materialData = {
      taskId,
      material_id: !isCustomMaterial ? selectedMaterialId : null,
      custom_name: isCustomMaterial ? customMaterialName : null,
      custom_unit: isCustomMaterial ? customMaterialUnit : null,
      quantity: materialQuantity,
      note: materialNote || null
    };
    await onAddMaterial(materialData);
    // Сброс формы
    setMaterialQuantity(1);
    setMaterialNote('');
    setSelectedMaterialId('');
    setCustomMaterialName('');
    setCustomMaterialUnit('');
    setIsCustomMaterial(false);
    setMaterialSearchTerm('');
    setShowSearchResults(false);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Добавить материал к задаче</ModalHeader>
      <ModalBody>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <Label className="mb-0">Тип материала</Label>
          <FormControlLabel
            control={<CustomSwitch checked={isCustomMaterial} onChange={(e) => {
              setIsCustomMaterial(e.target.checked);
              if (e.target.checked) { setSelectedMaterialId(''); setMaterialSearchTerm(''); }
              else { setCustomMaterialName(''); setCustomMaterialUnit(''); }
            }} color="primary" />}
            label={isCustomMaterial ? "Кастомный материал" : "Из справочника"}
            labelPlacement="start"
          />
        </div>

        {!isCustomMaterial ? (
          <>
            <FormGroup>
              <Label for="materialSearch">Поиск материала</Label>
              <div style={{ position: 'relative' }}>
                <InputGroup>
                  <InputGroupText className="bg-white"><SearchIcon fontSize="small" /></InputGroupText>
                  <Input type="text" id="materialSearch" placeholder="Введите название..." value={materialSearchTerm}
                    onChange={(e) => { setMaterialSearchTerm(e.target.value); setShowSearchResults(true); if (!e.target.value) setSelectedMaterialId(''); }}
                    onFocus={() => setShowSearchResults(true)} autoComplete="off" />
                  {materialSearchTerm && (
                    <InputGroupText className="bg-white" style={{ cursor: 'pointer' }} onClick={() => { setMaterialSearchTerm(''); setSelectedMaterialId(''); setShowSearchResults(false); }}>
                      <CloseIcon fontSize="small" />
                    </InputGroupText>
                  )}
                </InputGroup>
                {showSearchResults && materialSearchTerm && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, maxHeight: '300px', overflowY: 'auto', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    {filteredMaterials.length > 0 ? filteredMaterials.map(material => (
                      <div key={material.id} onClick={() => handleSelectMaterial(material.id, material.name)}
                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                        <div style={{ fontWeight: 500 }}>{material.name}</div>
                        <div style={{ fontSize: '0.85em', color: '#6c757d' }}>Ед. изм: {material.unit}{material.description && ` • ${material.description}`}</div>
                      </div>
                    )) : (
                      <div style={{ padding: '15px', textAlign: 'center', color: '#6c757d' }}>Материалы не найдены</div>
                    )}
                  </div>
                )}
              </div>
              {selectedMaterialId && (
                <div className="mt-2 text-success">
                  <small><CheckCircleIcon fontSize="small" style={{ marginRight: '4px', fontSize: '16px' }} /> Выбран материал: {availableMaterials.find(m => m.id === selectedMaterialId)?.name}</small>
                </div>
              )}
            </FormGroup>
            {selectedMaterialId && (
              <Alert color="info" className="mt-2">
                <div className="d-flex align-items-center">
                  <InventoryIcon fontSize="small" style={{ marginRight: '8px' }} />
                  <div>
                    <strong>{availableMaterials.find(m => m.id === selectedMaterialId)?.name}</strong><br />
                    <small>Ед. измерения: {availableMaterials.find(m => m.id === selectedMaterialId)?.unit}</small>
                  </div>
                </div>
              </Alert>
            )}
          </>
        ) : (
          <>
            <FormGroup><Label for="customName">Название материала *</Label><Input type="text" id="customName" value={customMaterialName} onChange={e => setCustomMaterialName(e.target.value)} placeholder="Например: Специальный состав" autoFocus /></FormGroup>
            <FormGroup><Label for="customUnit">Единица измерения *</Label><Input type="text" id="customUnit" value={customMaterialUnit} onChange={e => setCustomMaterialUnit(e.target.value)} placeholder="Например: шт, м, кг" /></FormGroup>
          </>
        )}

        <FormGroup><Label for="quantity">Количество *</Label><Input type="number" id="quantity" value={materialQuantity} onChange={e => setMaterialQuantity(parseFloat(e.target.value) || 0)} min="0.01" step="0.01" /></FormGroup>
        <FormGroup><Label for="note">Примечание (опционально)</Label><Input type="textarea" id="note" value={materialNote} onChange={e => setMaterialNote(e.target.value)} placeholder="Дополнительная информация" rows="2" /></FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>Отмена</Button>
        <Button color="primary" onClick={handleAdd} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}>Добавить</Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddMaterialModal;