import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MaterialList from './MaterialList';
import AddMaterial from './AddMaterial';
import '../../css/Material.css';

const MaterialsEvent = () => {
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [refreshList, setRefreshList] = useState(false);

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    // Прокрутка к форме
    document.getElementById('material-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleMaterialCreated = () => {
    setRefreshList(prev => !prev);
    setEditingMaterial(null);
  };

  return (
    <Container fluid className="py-4">
      <ToastContainer />
      <Row>
        <Col lg={5}>
          <Card className="mb-4 shadow-sm sticky-top" style={{ top: '20px' }} id="material-form">
            <CardBody>
              <AddMaterial
                key={editingMaterial ? editingMaterial.id : 'new'}
                initialData={editingMaterial}
                onMaterialCreated={handleMaterialCreated}
              />
            </CardBody>
          </Card>
        </Col>
        <Col lg={7}>
          <Card className="mb-4 shadow-sm">
            <CardBody>
              <MaterialList
                onEditMaterial={handleEditMaterial}
                key={refreshList ? 'refreshed' : 'normal'}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MaterialsEvent;