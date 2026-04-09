const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Загрузка файлов
router.post('/upload', authMiddleware, fileController.uploadFile);
router.post('/upload-multiple', authMiddleware, fileController.uploadMultipleFiles);

// Получение файлов
router.get('/entity/:entity_type/:entity_id', authMiddleware, fileController.getEntityFiles);
router.get('/task/:task_id', authMiddleware, fileController.getTaskFiles);
router.get( '/files/download/:entity_type/:filename', fileController.downloadFile);



// router.get('/info/:id', authMiddleware, fileController.getFileInfo);
router.get('/:entity_type/:filename', fileController.getFile);
// router.get('/download/:entity_type/:filename', authMiddleware, fileController.downloadFile);

// Обновление файла
router.put('/:id', authMiddleware, fileController.updateFile);

// Удаление файлов
router.delete('/:id', authMiddleware, fileController.deleteFile);

module.exports = router;