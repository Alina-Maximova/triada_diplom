const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware');


// Доступные материалы
router.get('/available', authMiddleware, materialController.getAvailableMaterials);
router.post('/available', authMiddleware, materialController.createMaterial);
router.put('/available/:id', authMiddleware, materialController.updateMaterial);
router.delete('/available/:id', authMiddleware, materialController.deleteMaterial);

// Материалы задач
router.get('/:taskId', authMiddleware, materialController.getTaskMaterials);
router.post('/:taskId', authMiddleware, materialController.addMaterialToTask);
router.delete('/:taskMaterialId', authMiddleware, materialController.removeMaterialFromTask);
router.put('/quantity/:taskMaterialId', authMiddleware, materialController.updateMaterialQuantity);
router.get('/task/:taskId/export', authMiddleware, materialController.exportTaskMaterials);

module.exports = router;