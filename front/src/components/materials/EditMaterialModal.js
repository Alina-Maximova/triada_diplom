// src/components/task/EditMaterialModal.js
import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input } from 'reactstrap';
import { toast } from 'react-toastify';

const EditMaterialModal = ({ isOpen, toggle, material, onUpdate }) => {
  const [quantity, setQuantity] = useState(material?.quantity || 1);
  const [note, setNote] = useState(material?.note || '');

  useEffect(() => {
    if (material) {
      setQuantity(material.quantity);
      setNote(material.note || '');
    }
  }, [material]);

  const handleUpdate = () => {
    if (!quantity || quantity <= 0) {
      toast.error('Укажите количество');
      return;
    }
    onUpdate(material.id, quantity, note);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Редактировать количество материала</ModalHeader>
      <ModalBody>
        <p><strong>Материал:</strong> {material?.material_name || material?.custom_name}</p>
        <p><strong>Ед. измерения:</strong> {material?.material_unit || material?.custom_unit}</p>
        <FormGroup><Label for="editQuantity">Количество *</Label><Input type="number" id="editQuantity" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} min="0.01" step="0.01" /></FormGroup>
        <FormGroup><Label for="editNote">Примечание</Label><Input type="textarea" id="editNote" value={note} onChange={e => setNote(e.target.value)} rows="2" /></FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>Отмена</Button>
        <Button color="primary" onClick={handleUpdate} style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}>Сохранить</Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditMaterialModal;